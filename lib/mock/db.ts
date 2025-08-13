// lib/mock/db.ts
import { randomUUID } from "crypto";
import type {
  Entity,
  EntityLog,
  NewEntityRequest,
  MoaRequest,
  School,
  SchoolAccount,
  SchoolEntity,
  PrivateNote,
  BaseDocument,
  SignedDocument,
  DocumentType,
  UUID,
  ISODate,
} from "@/types/db";

/** ─────────────────────────────────────────────────────────────────────────────
 * Local types
 * ────────────────────────────────────────────────────────────────────────────*/
export type EntityAccount = {
  id: string;
  entityId: string;
  email: string;
  name: string;
  password: string; // dev only
  role: "admin" | "member";
};

/** ─────────────────────────────────────────────────────────────────────────────
 * Config & RNG
 * ────────────────────────────────────────────────────────────────────────────*/
const COUNTS = {
  schools: 5,
  accountsPerSchool: [3, 6] as const,
  entities: 60,
  logsPerEntity: [2, 5] as const,
  notesPerEntity: [0, 3] as const,
  newEntityRequests: 12,
  moaRequests: 24,
  signedDocs: 24,
};

const SEED = String(process.env.MOCK_SEED ?? "dlsu-moa-seed-2025");
const rng = mulberry32(hashStringToInt(SEED));

const now = (): ISODate => new Date().toISOString();
const genId = () => randomUUID();

/** ─────────────────────────────────────────────────────────────────────────────
 * Static pools (PH flavored)
 * ────────────────────────────────────────────────────────────────────────────*/
const docTypes: DocumentType[] = [
  "BIR registration",
  "SEC registration",
  "Business Permit",
  "Other",
];

const firstNames = [
  "Maria",
  "Jose",
  "Juan",
  "Isabel",
  "Liza",
  "Arman",
  "Paolo",
  "Rafael",
  "Miguel",
  "Ana",
  "Sofia",
  "Carlo",
  "Elena",
  "Marco",
  "Patricia",
  "Regina",
  "Luis",
  "Nina",
  "Enzo",
  "Bianca",
];
const lastNames = [
  "Santos",
  "Reyes",
  "Cruz",
  "Mendoza",
  "Garcia",
  "Dela Cruz",
  "Lopez",
  "Ramos",
  "Castillo",
  "Torres",
  "Bautista",
  "Flores",
  "Navarro",
  "Domingo",
  "Valdez",
  "Rivera",
  "Jimenez",
  "Gonzales",
];

const companyPrefixes = [
  "Aurora",
  "Nimbus",
  "Veridian",
  "Monarch",
  "Vertex",
  "Atlas",
  "Helios",
  "Quantum",
  "Bluewave",
  "Evergreen",
  "Summit",
  "Northwind",
  "Pioneer",
  "Prime",
  "Oakridge",
  "Crescent",
];
const companySuffixes = [
  "Systems",
  "Labs",
  "Industries",
  "Holdings",
  "Group",
  "Global",
  "Tech",
  "Solutions",
  "Works",
  "Partners",
  "Network",
  "Logistics",
  "Foods",
  "Media",
  "Analytics",
];

const schoolNames: [string, string, string][] = [
  ["De La Salle University", "DLSU", "dlsu.edu.ph"],
  ["Ateneo de Manila University", "ADMU", "ateneo.edu"],
  ["University of the Philippines", "UP", "up.edu.ph"],
  ["Mapúa University", "MAPUA", "mapua.edu.ph"],
  ["University of Santo Tomas", "UST", "ust.edu.ph"],
];

const schoolRoles: SchoolAccount["role"][] = ["superadmin", "legal", "company_approver", "viewer"];

/** ─────────────────────────────────────────────────────────────────────────────
 * Tiny utils
 * ────────────────────────────────────────────────────────────────────────────*/
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function pickMany<T>(arr: T[], n: number): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
}
function randInt(min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function chance(p: number) {
  return rng() < p;
}
function tsOffsetDays(days: number): ISODate {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function phone() {
  return `+63 9${randInt(10, 99)} ${randInt(100, 999)} ${randInt(1000, 9999)}`;
}
function personName() {
  return `${pick(firstNames)} ${pick(lastNames)}`;
}
function companyName() {
  return `${pick(companyPrefixes)} ${pick(companySuffixes)}`;
}
function safePick<T>(arr: T[]): T | undefined {
  return arr.length ? pick(arr) : undefined;
}
function emailFor(name: string, domain: string) {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@${domain}`;
}
function weighted<T>(items: T[], weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let i = 0; i < items.length; i++) {
    if ((r -= weights[i]) <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** ─────────────────────────────────────────────────────────────────────────────
 * Builder (HMR-safe)
 * ────────────────────────────────────────────────────────────────────────────*/
function buildMockDB() {
  /** Schools */
  const schools: School[] = Array.from({ length: COUNTS.schools }, (_, i) => {
    const [full, short, domain] = schoolNames[i % schoolNames.length];
    return { uid: genId(), fullName: full, shortName: short, domain };
  });

  const getDlsu = () => schools.find((s) => s.shortName === "DLSU")!;
  const isDlsu = (s: School) => s.shortName === "DLSU";

  /** School Accounts (seed a predictable core for DLSU) */
  const schoolAccounts: SchoolAccount[] = schools.flatMap((s) => {
    const core: SchoolAccount[] = isDlsu(s)
      ? [
          {
            id: genId(),
            schoolId: s.uid,
            role: "superadmin",
            name: "DLSU Admin",
            receiveNewOrgRequests: true,
            receiveMoaRequests: true,
          },
          {
            id: genId(),
            schoolId: s.uid,
            role: "legal",
            name: "Atty. R. Valdez",
            receiveNewOrgRequests: false,
            receiveMoaRequests: true,
          },
          {
            id: genId(),
            schoolId: s.uid,
            role: "company_approver",
            name: "MOA Approver",
            receiveNewOrgRequests: true,
            receiveMoaRequests: true,
          },
        ]
      : [];

    const count = randInt(COUNTS.accountsPerSchool[0], COUNTS.accountsPerSchool[1]);
    const randoms = Array.from({ length: count }).map(() => ({
      id: genId(),
      schoolId: s.uid,
      role: pick(schoolRoles),
      name: personName(),
      receiveNewOrgRequests: chance(0.6),
      receiveMoaRequests: chance(0.7),
    }));

    return [...core, ...randoms];
  });

  /** Entities — matches your types exactly */
  const entities: Entity[] = Array.from({ length: COUNTS.entities }).map(() => {
    const display = companyName();
    const legalId = `TIN-${randInt(100000000, 999999999)}`;
    const contact = personName();
    const domain = "example.com";
    return {
      id: genId(),
      type: pick(["company", "ngo", "individual"]),
      displayName: display,
      legalIdentifier: legalId,
      contactName: contact,
      contactEmail: emailFor(contact, domain),
    };
  });

  /** Link: Entities ↔ Schools (bias DLSU presence a bit) */
  const schoolEntities: SchoolEntity[] = [];
  for (const e of entities) {
    const k = randInt(1, Math.min(2, schools.length));
    const dlsu = getDlsu();
    const pool = schools.slice();
    if (!pool.includes(dlsu)) pool.unshift(dlsu);
    const chosen: School[] = [];
    while (chosen.length < k) {
      const s = weighted(
        pool,
        pool.map((x) => (isDlsu(x) ? 0.6 : 0.4 / (pool.length - 1)))
      );
      if (!chosen.includes(s)) chosen.push(s);
    }
    for (const s of chosen) {
      schoolEntities.push({
        id: genId(),
        entityId: e.id, // IMPORTANT: id (not uid)
        schoolID: s.uid,
        status: pick(["registered", "approved", "blacklisted"]),
      });
    }
  }

  /** Private Notes */
  const privateNotes: PrivateNote[] = [];
  for (const se of schoolEntities) {
    const notes = randInt(COUNTS.notesPerEntity[0], COUNTS.notesPerEntity[1]);
    for (let i = 0; i < notes; i++) {
      const author =
        safePick(schoolAccounts.filter((a) => a.schoolId === se.schoolID)) ?? pick(schoolAccounts);
      privateNotes.push({
        id: genId(),
        authorId: author.id,
        entityId: se.entityId,
        message: pick([
          "Good compliance track record.",
          "Pending updated business permit.",
          "Requested notarized signature page.",
          "Clarify signatory authority.",
          "Legal review required.",
        ]),
        timestamp: tsOffsetDays(-randInt(0, 120)),
      });
    }
  }

  /** Entity Logs */
  const entityLogs: EntityLog[] = [];
  for (const e of entities) {
    const n = randInt(COUNTS.logsPerEntity[0], COUNTS.logsPerEntity[1]);
    for (let i = 0; i < n; i++) {
      const school = weighted(
        schools,
        schools.map((s) => (isDlsu(s) ? 0.55 : 0.45 / (schools.length - 1)))
      );
      entityLogs.push({
        uuid: genId(),
        update: pick(["registered", "requested", "approved", "blacklisted", "note"]),
        source: pick(["school", "entity"]),
        target: school.shortName,
        file: chance(0.25)
          ? `/docs/mock/${e.displayName.toLowerCase().replace(/\s+/g, "-")}-ref-${i + 1}.pdf`
          : null,
        timestamp: tsOffsetDays(-randInt(0, 200)),
        entityId: e.id, // IMPORTANT
      });
    }
  }

  /** Requests — SAFE picking school accounts (no undefined.id) */
  const newEntityRequests: NewEntityRequest[] = Array.from({
    length: COUNTS.newEntityRequests,
  }).map(() => {
    const e = pick(entities);
    const school = pick(schools);
    const processed = chance(0.5);
    const eligible = schoolAccounts.filter((a) => a.schoolId === school.uid);
    const processedBy = processed ? safePick(eligible)?.id : undefined;

    return {
      entityID: e.id,
      messageID: genId(),
      processedBy,
      processedDate: processed ? tsOffsetDays(-randInt(0, 60)) : undefined,
      resultAction: processed ? pick(["approved", "denied", "continuedDialogue"]) : undefined,
      timestamp: tsOffsetDays(-randInt(0, 90)),
    };
  });

  const moaRequests: MoaRequest[] = Array.from({ length: COUNTS.moaRequests }).map(() => {
    const e = pick(entities);
    const school = pick(schools);
    const processed = chance(0.6);
    const eligible = schoolAccounts.filter((a) => a.schoolId === school.uid);
    const notifySchoolAccount = safePick(eligible)?.id;
    const processedBy = processed ? safePick(eligible)?.id : undefined;

    return {
      messageID: genId(),
      entityID: e.id,
      schoolID: school.uid,
      notifySchoolAccount,
      processedBy,
      processedDate: processed ? tsOffsetDays(-randInt(0, 45)) : undefined,
      resultAction: processed ? pick(["approved", "denied", "continuedDialogue"]) : undefined,
      timestamp: tsOffsetDays(-randInt(0, 60)),
    };
  });

  /** Documents (minimal demo) */
  const baseDocuments: BaseDocument[] = Array.from({ length: COUNTS.signedDocs }).map((_, i) => ({
    uid: genId(),
    url: `/docs/mock/moa/moa-${i + 1}.pdf`,
  }));
  const signedDocuments: SignedDocument[] = baseDocuments.map((b, i) => ({
    base_document_id: b.uid,
    document_verification_code: `MOA-${1000 + i}-${2000 + i}-${3000 + i}`,
    parties: [{ name: personName(), email: emailFor(personName(), "example.com") }],
    type: "Standard MOA",
    notarized_link: chance(0.5) ? `/docs/mock/notaries/notary-${i + 1}.pdf` : null,
    effective_date: tsOffsetDays(-randInt(10, 180)),
    expiry_date: chance(0.5) ? tsOffsetDays(randInt(30, 365)) : null,
  }));

  /** Mock entity accounts */
  const entityAccounts: EntityAccount[] = [
    {
      id: genId(),
      entityId: entities[0]?.id ?? "entity-1",
      email: "isabel@aurora.com",
      name: "Isabel Reyes",
      password: "pass1234",
      role: "admin",
    },
    {
      id: genId(),
      entityId: entities[1]?.id ?? "entity-2",
      email: "ops@example.com",
      name: "Operations Team",
      password: "password",
      role: "member",
    },
  ];

  /** Helpers (entity id everywhere) */
  function listEntities(params?: { q?: string; limit?: number; offset?: number }) {
    const q = (params?.q ?? "").toLowerCase();
    let out = entities;
    if (q) {
      out = out.filter(
        (e) =>
          e.displayName.toLowerCase().includes(q) ||
          e.legalIdentifier.toLowerCase().includes(q) ||
          (e.contactEmail ?? "").toLowerCase().includes(q) ||
          (e.contactName ?? "").toLowerCase().includes(q)
      );
    }
    const offset = params?.offset ?? 0;
    const limit = params?.limit ?? 25;
    return { total: out.length, items: out.slice(offset, offset + limit) };
  }

  function listEntityLogs(entityId: UUID) {
    return entityLogs
      .filter((l) => l.entityId === entityId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  function appendEntityLog(log: Omit<EntityLog, "uuid" | "timestamp"> & { timestamp?: ISODate }) {
    const row: EntityLog = { uuid: genId(), timestamp: log.timestamp ?? now(), ...log };
    entityLogs.push(row);
    return row;
  }

  function findSchoolById(uid: UUID) {
    return schools.find((s) => s.uid === uid) || null;
  }

  function listSchoolEntities(schoolID: UUID) {
    return schoolEntities.filter((se) => se.schoolID === schoolID);
  }

  function findSignedByVerificationCode(code: string) {
    return signedDocuments.find((d) => d.document_verification_code === code) || null;
  }

  function findEntityAccountByEmail(email: string) {
    const e = email.toLowerCase();
    return entityAccounts.find((a) => a.email.toLowerCase() === e) || null;
  }

  function findEntityById(eid: UUID) {
    return entities.find((e) => e.id === eid) || null;
  }

  return {
    // data
    schools,
    schoolAccounts,
    entities,
    schoolEntities,
    privateNotes,
    entityLogs,
    newEntityRequests,
    moaRequests,
    baseDocuments,
    signedDocuments,
    entityAccounts,
    // helpers
    listEntities,
    listEntityLogs,
    appendEntityLog,
    findSchoolById,
    listSchoolEntities,
    findSignedByVerificationCode,
    findEntityAccountByEmail,
    findEntityById,
  };
}

/** ─────────────────────────────────────────────────────────────────────────────
 * HMR-safe singleton + re-exports
 * ────────────────────────────────────────────────────────────────────────────*/
type MockDB = ReturnType<typeof buildMockDB>;

declare global {
  // eslint-disable-next-line no-var
  var __MOCK_DB__: MockDB | undefined;
}

export const DB: MockDB = globalThis.__MOCK_DB__ ?? (globalThis.__MOCK_DB__ = buildMockDB());

export const {
  schools,
  schoolAccounts,
  entities,
  schoolEntities,
  privateNotes,
  entityLogs,
  newEntityRequests,
  moaRequests,
  baseDocuments,
  signedDocuments,
  entityAccounts,
  listEntities,
  listEntityLogs,
  appendEntityLog,
  findSchoolById,
  listSchoolEntities,
  findSignedByVerificationCode,
  findEntityAccountByEmail,
  findEntityById,
} = DB;

/** ─────────────────────────────────────────────────────────────────────────────
 * RNG + tiny hashes
 * ────────────────────────────────────────────────────────────────────────────*/
function hashStringToInt(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSmall(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16);
}
