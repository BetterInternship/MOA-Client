// lib/types/db.ts

// ---------- Shared ----------
export type UUID = string; // randomUUID
export type ISODate = string; // ISO timestamp
export type URLString = string;

export type DocumentType = "BIR registration" | "SEC registration" | "Business Permit" | "Other";

export type RequestResult = "approved" | "denied" | "continuedDialogue";
export type SourceType = "school" | "entity";

// ---------- MOA SIDE ----------
export type EntityDocument = {
  documentType: DocumentType;
  url: URLString;
};

export type Entity = {
  id: string;
  type: string;
  display_name: string;
  legal_identifier: string;
  contact_name?: string;
  contact_email?: string;
};

export type EntityLog = {
  uuid: UUID;
  update: "registered" | "requested" | "approved" | "blacklisted" | "revoked" | "note";
  source: SourceType;
  target: string; // e.g., school short name or entity id
  file: URLString | null; // link to related doc if any
  timestamp: ISODate;
  entityId: UUID;
};

export type NewEntityRequest = {
  entityID: UUID;
  messageID: UUID;
  processedBy?: UUID; // schoolAccountId
  processedDate?: ISODate;
  resultAction?: RequestResult;
  timestamp: ISODate;
};

export type MoaRequest = {
  messageID: UUID;
  entityID: UUID;
  notifySchoolAccount?: UUID; // schoolAccountId
  schoolID: UUID;
  processedBy?: UUID; // schoolAccountId
  processedDate?: ISODate;
  resultAction?: RequestResult;
  timestamp: ISODate;
};

export type Thread = {
  uid: UUID;
};

export type Message = {
  uid: UUID;
  sourceType: SourceType;
  sourceId: UUID;
  targetId: UUID;
  threadID: UUID;
  MOADocument?: URLString | null;
  action: "approve" | "deny" | "reply";
  comments?: string;
  attachments?: URLString[];
  timestamp: ISODate;
};

// ---------- UNIV SIDE ----------
export type School = {
  uid: UUID;
  fullName: string;
  shortName: string;
  domain: string;
};

export type SchoolAccount = {
  id: UUID;
  schoolId: UUID;
  role: "superadmin" | "legal" | "company_approver" | "viewer";
  name: string;
  receiveNewOrgRequests: boolean;
  receiveMoaRequests: boolean;
};

export type SchoolLog = {
  actionBy: UUID; // accountId
  actionType: string;
  entity_id: UUID;
  datetime: ISODate;
};

export type MoaHistory = {
  date: ISODate;
  action: string;
  details?: string;
};

export type SchoolEntity = {
  id: UUID;
  entityId: UUID;
  schoolID: UUID;
  status: "registered" | "approved" | "blacklisted";
};

export type PrivateNote = {
  id: UUID;
  authorId: UUID; // account id
  entityId: UUID;
  message: string;
  timestamp: ISODate;
};

// ---------- DOCUMENT STORAGE ----------
export type BaseDocument = {
  uid: UUID;
  url: URLString;
};

export type BaseImage = {
  uid: UUID;
  file_name: string;
  source_text?: string;
  url: URLString;
};

export type SignedDocumentParty = { name: string; email?: string };

export type SignedDocument = {
  base_document_id: UUID;
  inputs?: Record<string, string>;
  inputs_hash?: string;
  document_verification_code: string; // your 10-10-10
  parties: SignedDocumentParty[];
  type?: string;
  notarized_link?: URLString | null;
  effective_date?: ISODate | null;
  expiry_date?: ISODate | null;
};
