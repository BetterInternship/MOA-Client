/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-22
 * @ Description:
 *
 * Migration utilities for upgrading form metadata from v0 to v1 schema.
 * Handles conversion of flat field arrays to block-based structure,
 * party system transformation, and data restructuring.
 */

import crypto from "crypto";
import {
  IFormMetadata,
  IFormBlock,
  IFormField,
  IFormPhantomField,
  IFormSigningParty,
  IFormSignatory,
  IFormSubscriber,
  SCHEMA_VERSION,
} from "@betterinternship/core/forms";

/**
 * Old form metadata v0 interfaces (before migration)
 */
export interface OldIFormMetadata {
  name: string;
  label: string;
  schema_version: number;
  schema: OldIFormField[];
  schema_phantoms?: OldIFormPhantomField[];
  subscribers: OldIFormSubscriber[];
  signatories: OldIFormSignatory[];
  required_parties: OldIFormPendingParties[];
  params?: OldIFormParams;
}

export interface OldIFormParams {
  [key: string]: string | OldIFormParams;
}

export interface OldIFormContact {
  name: string;
  honorific: string;
  title: string;
  email: string;
}

export type OldIFormSubscriber = OldIFormContact;

export interface OldIFormSignatory extends OldIFormContact {
  field: string;
}

export type OldIFormPendingParties = {
  party: string;
  order: number;
};

export interface OldIFormField {
  field: string;
  type: "text" | "signature";
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
  align_h?: "left" | "center" | "right";
  align_v?: "top" | "middle" | "bottom";
  label: string;
  source: "auto" | "prefill" | "derived" | "manual";
  party: "university" | "entity" | "student" | "student-guardian" | string;
  shared: boolean;
  descriptor?: boolean;
  tooltip_label: string;
  validator: string;
  prefiller: string;
}

export interface OldIFormPhantomField {
  field: string;
  label: string;
  type: "email" | "param";
  source: "auto" | "prefill" | "derived" | "manual";
  party: "university" | "entity" | "student" | "student-guardian" | string;
  shared: boolean;
  descriptor?: boolean;
  tooltip_label: string;
  validator: string;
  prefiller: string;
}

/**
 * Options for controlling migration behavior
 */
export interface MigrationOptions {
  /**
   * Strategy for generating signing party IDs
   * 'index': Uses numeric index (party-0, party-1, etc.)
   * 'name': Uses party name (party-student, party-university, etc.)
   * 'uuid': Generates UUID v4
   * Default: 'index'
   */
  partyIdStrategy?: "index" | "name" | "uuid";

  /**
   * Strategy for generating account IDs for subscribers/signatories
   * 'email-hash': Hash the email address
   * 'uuid': Generate UUID v4
   * 'email': Use email as ID (not recommended but possible)
   * Default: 'email-hash'
   */
  accountIdStrategy?: "email-hash" | "uuid" | "email";

  /**
   * Whether to preserve descriptor fields as separate header/paragraph blocks
   * Default: true
   */
  preserveDescriptors?: boolean;

  /**
   * Mapping of old party names to new signing party IDs for explicit control
   * If provided, overrides partyIdStrategy
   * Example: { 'student': 'party-student-1', 'university': 'party-uni-1' }
   */
  partyMapping?: Record<string, string>;

  /**
   * Mapping of signatory fields to account IDs for explicit control
   * If provided, overrides accountIdStrategy for matching signatories
   * Example: { 'student.signature': 'account-john-123' }
   */
  accountMapping?: Record<string, string>;
}

/**
 * Utility class for migrating form metadata from v0 to v1
 */
export class FormMetadataMigrator {
  private options: Required<MigrationOptions>;
  private partyMap: Map<string, string> = new Map();
  private accountMap: Map<string, string> = new Map();
  private blockIdCounter = 0;

  constructor(options: MigrationOptions = {}) {
    this.options = {
      partyIdStrategy: options.partyIdStrategy ?? "index",
      accountIdStrategy: options.accountIdStrategy ?? "email-hash",
      preserveDescriptors: options.preserveDescriptors ?? true,
      partyMapping: options.partyMapping ?? {},
      accountMapping: options.accountMapping ?? {},
    };
  }

  /**
   * Main migration function: converts old v0 metadata to new v1 metadata
   */
  migrate(oldForm: OldIFormMetadata): IFormMetadata {
    // Step 1: Build signing parties from required_parties and signatories
    let signingParties = this.buildSigningParties(oldForm.required_parties, oldForm.signatories);

    // Step 1b: Ensure there's always at least a "student" signing party
    if (signingParties.length === 0) {
      signingParties = [
        {
          _id: "party-student",
          order: 1,
          signed: false,
        },
      ];
      this.partyMap.set("student", "party-student");
    }

    // Step 2: Convert fields to blocks
    const fieldBlocks = this.fieldsToBlocks(oldForm.schema);

    // Step 3: Convert phantom fields to blocks
    const phantomBlocks = this.phantomFieldsToBlocks(oldForm.schema_phantoms || []);

    // Step 4: Build new metadata
    return {
      name: oldForm.name,
      label: oldForm.label,
      schema_version: SCHEMA_VERSION,
      schema: {
        blocks: [...fieldBlocks, ...phantomBlocks],
      },
      signing_parties: signingParties,
      subscribers: this.migrateSubscribers(oldForm.subscribers),
    };
  }

  /**
   * Build signing parties from old required_parties and signatories
   */
  private buildSigningParties(
    requiredParties: OldIFormPendingParties[],
    signatories: OldIFormSignatory[]
  ): IFormSigningParty[] {
    return requiredParties
      .sort((a, b) => a.order - b.order)
      .map((party, index) => {
        const partyId = this.generateOrMapPartyId(party.party, index);
        this.partyMap.set(party.party, partyId);

        // Find matching signatory for this party
        const matchingSignatory = signatories.find((sig) =>
          this.isSignatoryForParty(sig.field, party.party)
        );

        const signingParty: IFormSigningParty = {
          _id: partyId,
          order: party.order,
          signed: false,
        };

        if (matchingSignatory) {
          const accountId = this.generateOrMapAccountId(
            matchingSignatory.field,
            matchingSignatory.email
          );
          this.accountMap.set(matchingSignatory.field, accountId);

          signingParty.signatory_account = {
            account_id: accountId,
            name: matchingSignatory.name,
            email: matchingSignatory.email,
            title: matchingSignatory.title,
            honorific: matchingSignatory.honorific,
          };
        }

        return signingParty;
      });
  }

  /**
   * Convert old fields to new block structure
   * Note: Fields with w === 0 or h === 0 are treated as phantom fields
   */
  private fieldsToBlocks(oldFields: OldIFormField[]): IFormBlock[] {
    return oldFields
      .sort((a, b) => {
        // Primary sort by page, secondary by y position, tertiary by x
        if (a.page !== b.page) return a.page - b.page;
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      })
      .map((field, index) => {
        const partyId = this.getOrGeneratePartyId(field.party);

        // Check if this is a phantom field (0 width or height)
        if (field.w === 0 || field.h === 0) {
          const newPhantomField: IFormPhantomField = {
            field: field.field,
            type: field.type,
            label: field.label,
            tooltip_label: field.tooltip_label,
            shared: field.shared,
            signing_party_id: partyId,
            source: field.source as any,
            validator: field.validator,
            prefiller: field.prefiller,
          };

          const block: IFormBlock = {
            _id: this.generateBlockId("phantom", index),
            block_type: "form_phantom_field",
            order: index,
            signing_party_id: partyId,
            phantom_field_schema: newPhantomField,
          };

          return block;
        }

        // Regular form field
        const newField: IFormField = {
          field: field.field,
          type: field.type,
          x: field.x,
          y: field.y,
          w: field.w,
          h: field.h,
          page: field.page,
          align_h: field.align_h,
          align_v: field.align_v,
          label: field.label,
          tooltip_label: field.tooltip_label,
          shared: field.shared,
          signing_party_id: partyId,
          source: field.source as any,
          validator: field.validator,
          prefiller: field.prefiller,
        };

        const block: IFormBlock = {
          _id: this.generateBlockId("field", index),
          block_type: "form_field",
          order: index,
          signing_party_id: partyId,
          field_schema: newField,
        };

        return block;
      });
  }

  /**
   * Convert old phantom fields to new block structure
   */
  private phantomFieldsToBlocks(oldPhantomFields: OldIFormPhantomField[]): IFormBlock[] {
    return oldPhantomFields.map((phantom, index) => {
      const partyId = this.getOrGeneratePartyId(phantom.party);

      // Convert old phantom field types to actual field types
      const fieldType: "text" | "signature" | "image" = phantom.type === "email" ? "text" : "text";

      const newPhantomField: IFormPhantomField = {
        field: phantom.field,
        type: fieldType,
        label: phantom.label,
        tooltip_label: phantom.tooltip_label,
        shared: phantom.shared,
        signing_party_id: partyId,
        source: phantom.source as any,
        validator: phantom.validator,
        prefiller: phantom.prefiller,
      };

      const block: IFormBlock = {
        _id: this.generateBlockId("phantom", index),
        block_type: "form_phantom_field",
        order: index + 1000, // Offset to place after regular fields
        signing_party_id: partyId,
        phantom_field_schema: newPhantomField,
      };

      return block;
    });
  }

  /**
   * Migrate subscribers to new format
   */
  private migrateSubscribers(oldSubscribers: OldIFormSubscriber[]): IFormSubscriber[] {
    return oldSubscribers.map((subscriber) => {
      const accountId = this.generateOrMapAccountId(
        `subscriber-${subscriber.email}`,
        subscriber.email
      );

      return {
        account_id: accountId,
        name: subscriber.name,
        email: subscriber.email,
      };
    });
  }

  /**
   * Generate or retrieve party ID based on strategy
   */
  private generateOrMapPartyId(partyName: string, index: number): string {
    // Check if explicitly mapped
    if (this.options.partyMapping[partyName]) {
      return this.options.partyMapping[partyName];
    }

    // Generate based on strategy
    switch (this.options.partyIdStrategy) {
      case "name":
        return `party-${partyName.toLowerCase().replace(/\s+/g, "-")}`;
      case "uuid":
        return `party-${this.generateUUID()}`;
      case "index":
      default:
        return `party-${index}`;
    }
  }

  /**
   * Get or generate party ID (for fields that reference a party)
   */
  private getOrGeneratePartyId(partyName: string): string {
    // Check if already mapped
    if (this.partyMap.has(partyName)) {
      return this.partyMap.get(partyName)!;
    }

    // Generate new ID
    const id = this.generateOrMapPartyId(partyName, this.partyMap.size);
    this.partyMap.set(partyName, id);
    return id;
  }

  /**
   * Generate or retrieve account ID based on strategy
   */
  private generateOrMapAccountId(key: string, email: string): string {
    // Check if explicitly mapped
    if (this.options.accountMapping[key]) {
      return this.options.accountMapping[key];
    }

    // Generate based on strategy
    switch (this.options.accountIdStrategy) {
      case "email":
        return email;
      case "uuid":
        return `account-${this.generateUUID()}`;
      case "email-hash":
      default:
        return `account-${this.hashEmail(email)}`;
    }
  }

  /**
   * Determine if a signatory field belongs to a party
   * Convention: field name starts with party name or is listed under it
   */
  private isSignatoryForParty(field: string, party: string): boolean {
    const fieldPrefix = field.split(".")[0];
    const partyPrefix = party.replace("-", "_");
    return fieldPrefix.toLowerCase() === partyPrefix.toLowerCase() || field.includes(party);
  }

  /**
   * Generate a unique block ID
   */
  private generateBlockId(type: string, index: number): string {
    return `block-${type}-${this.blockIdCounter++}`;
  }

  /**
   * Hash email to create a consistent ID
   */
  private hashEmail(email: string): string {
    return crypto.createHash("sha256").update(email).digest("hex").slice(0, 12);
  }

  /**
   * Generate a UUID v4
   */
  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * Convenience function to migrate a single form
 */
export function migrateFormMetadata(
  oldForm: OldIFormMetadata,
  options?: MigrationOptions
): IFormMetadata {
  const migrator = new FormMetadataMigrator(options);
  return migrator.migrate(oldForm);
}

/**
 * Batch migrate multiple forms
 */
export function migrateFormMetadataBatch(
  oldForms: OldIFormMetadata[],
  options?: MigrationOptions
): IFormMetadata[] {
  const migrator = new FormMetadataMigrator(options);
  return oldForms.map((form) => migrator.migrate(form));
}

/**
 * Validation helper to check if a form is v0
 */
export function isFormMetadataV0(form: any): boolean {
  return (
    form.schema_version === 0 &&
    Array.isArray(form.schema) &&
    Array.isArray(form.required_parties) &&
    Array.isArray(form.signatories)
  );
}

/**
 * Validation helper to check if a form is v1
 */
export function isFormMetadataV1(form: any): boolean {
  return (
    form.schema_version === 1 &&
    form.schema &&
    Array.isArray(form.schema.blocks) &&
    Array.isArray(form.signing_parties)
  );
}

/**
 * Auto-detect and migrate form if needed
 */
export function autoMigrateFormMetadata(form: any, options?: MigrationOptions): IFormMetadata {
  if (isFormMetadataV0(form)) {
    return migrateFormMetadata(form as OldIFormMetadata, options);
  }
  if (isFormMetadataV1(form)) {
    return form as IFormMetadata;
  }
  throw new Error(`Unknown form metadata version: ${form.schema_version}`);
}
