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
 *  Types local to this mock
 *  ────────────────────────────────────────────────────────────────────────────*/
export type EntityAccount = {
  id: string;
  entityId: string;
  email: string;
  name: string;
  // PLAIN TEXT for dev ONLY
  password: string;
  role: "admin" | "member";
};

/** ─────────────────────────────────────────────────────────────────────────────
 *  Config & RNG (DLSU‑weighted)
 *  ────────────────────────────────────────────────────────────────────────────*/
const COUNTS = {
  schools: 5,
  accountsPerSchool: [4, 8] as const,
  entities: 60,
  logsPerEntity: [2, 8] as const,
  notesPerEntity: [0, 4] as const,
  newEntityRequests: 12,
  moaRequests: 28, // a bit more to showcase MOA flows
  signedDocs: 40,
};

// deterministic seed so data is stable across HMR
const SEED = String(process.env.MOCK_SEED ?? "dlsu-moa-seed-2025");
const rng = mulberry32(hashStringToInt(SEED));

const now = () => new Date().toISOString();
const id = () => randomUUID();

/** ─────────────────────────────────────────────────────────────────────────────
 *  Static pools (PH + DLSU flavored)
 *  ────────────────────────────────────────────────────────────────────────────*/
const docTypes: DocumentType[] = [
  "BIR registration",
  "SEC registration",
  "Business Permit",
  "Notarized Signature Page",
  "Other",
];

const personFirst = [
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
const personLast = [
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

// Put DLSU first; keep other PH HEIs for realism
const schoolNames: [string, string, string][] = [
  ["De La Salle University", "DLSU", "dlsu.edu.ph"],
  ["Ateneo de Manila University", "ADMU", "ateneo.edu"],
  ["University of the Philippines", "UP", "up.edu.ph"],
  ["Mapúa University", "MAPUA", "mapua.edu.ph"],
  ["University of Santo Tomas", "UST", "ust.edu.ph"],
];

// Roles aligned to the script/process you described
const schoolRoles = [
  "superadmin",
  "legal",
  "ssc", // Student Services / central student support
  "provost",
  "internship_coordinator",
  "company_approver",
  "viewer",
] as const;

/** ─────────────────────────────────────────────────────────────────────────────
 *  Tiny utils
 *  ────────────────────────────────────────────────────────────────────────────*/
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
function emailFor(name: string, domain: string) {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@${domain}`;
}
function personName() {
  return `${pick(personFirst)} ${pick(personLast)}`;
}
function companyName() {
  return `${pick(companyPrefixes)} ${pick(companySuffixes)}`;
}
function serial10() {
  let s = "";
  for (let i = 0; i < 10; i++) s += String(randInt(i === 0 ? 1 : 0, 9));
  return s;
}
function verificationCode() {
  return `${serial10()}-${serial10()}-${serial10()}`; // 10-10-10
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
 *  Builder (HMR-safe) — DLSU‑tailored
 *  ────────────────────────────────────────────────────────────────────────────*/
function buildMockDB() {
  /** Generate: Schools */
  const schools: School[] = Array.from({ length: COUNTS.schools }, (_, i) => {
    const [full, short, domain] = schoolNames[i % schoolNames.length];
    return { uid: id(), fullName: full, shortName: short, domain };
  });

  // convenience
  const getDlsu = () => schools.find((s) => s.shortName === "DLSU")!;
  const isDlsuSchool = (s: School) => s.shortName === "DLSU";

  /** Generate: School Accounts (seed some deterministic DLSU roles) */
  const schoolAccounts: SchoolAccount[] = schools.flatMap((s) => {
    // deterministic core accounts for DLSU so demos are predictable
    const coreDlsu: SchoolAccount[] = isDlsuSchool(s)
      ? [
          {
            id: id(),
            schoolId: s.uid,
            role: "superadmin",
            name: "DLSU Admin",
            receiveNewOrgRequests: true,
            receiveMoaRequests: true,
          },
          {
            id: id(),
            schoolId: s.uid,
            role: "legal",
            name: "Atty. Regina Valdez",
            receiveNewOrgRequests: false,
            receiveMoaRequests: true,
          },
          {
            id: id(),
            schoolId: s.uid,
            role: "ssc",
            name: "SSC Desk",
            receiveNewOrgRequests: true,
            receiveMoaRequests: true,
          },
          {
            id: id(),
            schoolId: s.uid,
            role: "provost",
            name: "Provost Office",
            receiveNewOrgRequests: false,
            receiveMoaRequests: true,
          },
          {
            id: id(),
            schoolId: s.uid,
            role: "internship_coordinator",
            name: "COE Internship Coordinator",
            receiveNewOrgRequests: true,
            receiveMoaRequests: true,
          },
        ]
      : [];

    const count = randInt(COUNTS.accountsPerSchool[0], COUNTS.accountsPerSchool[1]);
    const randoms = Array.from({ length: count }).map(() => {
      const name = personName();
      const role = pick([...schoolRoles]);
      return {
        id: id(),
        schoolId: s.uid,
        role,
        name,
        receiveNewOrgRequests: chance(0.6),
        receiveMoaRequests: chance(0.7),
      } as SchoolAccount;
    });

    return [...coreDlsu, ...randoms];
  });

  /** Generate: Entities */
  const entities: Entity[] = Array.from({ length: COUNTS.entities }).map(() => {
    const disp = companyName();
    const legal = `${disp} Inc.`;
    const contact = personName();
    const domain = "example.com";
    const docsCount = randInt(1, 3);
    const entityDocuments = Array.from({ length: docsCount }).map(() => ({
      documentType: pick(docTypes),
      url: `/docs/mock/${disp.toLowerCase().replace(/\s+/g, "-")}-${randInt(1, 9)}.pdf`,
    }));
    return {
      uid: id(),
      entityType: pick(["company", "ngo", "individual"] as const),
      entityDocuments,
      displayName: disp,
      legalName: legal,
      contactName: contact,
      contactEmail: emailFor(contact, domain),
      contactPhone: phone(),
    };
  });

  /** Link: Entities ↔ Schools (weight DLSU higher) */
  const schoolEntities: SchoolEntity[] = [];
  for (const e of entities) {
    // DLSU gets picked 60% of the time as one of the linked schools
    const k = randInt(1, Math.min(2, schools.length));
    const dlsu = getDlsu();
    const pool = schools.slice();
    if (!pool.includes(dlsu)) pool.unshift(dlsu);
    const chosen: School[] = [];
    while (chosen.length < k) {
      const s = weighted(
        pool,
        pool.map((x) => (isDlsuSchool(x) ? 0.6 : 0.4 / (pool.length - 1)))
      );
      if (!chosen.includes(s)) chosen.push(s);
    }
    for (const s of chosen) {
      schoolEntities.push({
        id: id(),
        entityId: e.uid,
        schoolID: s.uid,
        status: pick(["registered", "approved", "blacklisted"] as const),
      });
    }
  }

  /** Generate: Private Notes (more activity under DLSU) */
  const privateNotes: PrivateNote[] = [];
  for (const se of schoolEntities) {
    const notes =
      randInt(COUNTS.notesPerEntity[0], COUNTS.notesPerEntity[1]) +
      (chance(0.5) && se.schoolID === getDlsu().uid ? 1 : 0);
    for (let i = 0; i < notes; i++) {
      const author =
        pick(schoolAccounts.filter((a) => a.schoolId === se.schoolID)) || pick(schoolAccounts);
      privateNotes.push({
        id: id(),
        authorId: author.id,
        entityId: se.entityId,
        message: pick([
          "Good compliance track record.",
          "Pending updated business permit.",
          "Requested notarized signature page.",
          "Clarify signatory authority.",
          "Legal review required (DLSU Legal).",
          "SSC follow-up with coordinator.",
        ]),
        timestamp: tsOffsetDays(-randInt(0, 120)),
      });
    }
  }

  /** Generate: Entity Logs (bias target toward DLSU) */
  const entityLogs: EntityLog[] = [];
  for (const e of entities) {
    const n = randInt(COUNTS.logsPerEntity[0], COUNTS.logsPerEntity[1]);
    const updates: EntityLog["update"][] = [
      "registered",
      "requested",
      "approved",
      "blacklisted",
      "note",
    ];
    for (let i = 0; i < n; i++) {
      const school = weighted(
        schools,
        schools.map((s) => (isDlsuSchool(s) ? 0.55 : 0.45 / (schools.length - 1)))
      );
      entityLogs.push({
        uuid: id(),
        update: pick(updates),
        source: pick(["school", "entity"]),
        target: school.shortName, // e.g. "DLSU"
        file: chance(0.25)
          ? `/docs/mock/${e.displayName.toLowerCase().replace(/\s+/g, "-")}-ref-${i + 1}.pdf`
          : null,
        timestamp: tsOffsetDays(-randInt(0, 200)),
        entityId: e.uid,
      });
    }
  }

  /** Generate: Requests (New Entity / MOA) — DLSU seen more often */
  const newEntityRequests: NewEntityRequest[] = Array.from({
    length: COUNTS.newEntityRequests,
  }).map(() => {
    const e = pick(entities);
    const school = weighted(
      schools,
      schools.map((s) => (isDlsuSchool(s) ? 0.5 : 0.5 / (schools.length - 1)))
    );
    const processed = chance(0.5);
    const processedBy = processed
      ? pick(schoolAccounts.filter((a) => a.schoolId === school.uid)).id
      : undefined;
    const processedDate = processed ? tsOffsetDays(-randInt(0, 60)) : undefined;
    const resultAction = processed
      ? pick(["approved", "denied", "continuedDialogue"] as const)
      : undefined;
    return {
      entityID: e.uid,
      messageID: id(),
      processedBy,
      processedDate,
      resultAction,
      timestamp: tsOffsetDays(-randInt(0, 90)),
    };
  });

  const moaRequests: MoaRequest[] = Array.from({ length: COUNTS.moaRequests }).map(() => {
    const e = pick(entities);
    const school = weighted(
      schools,
      schools.map((s) => (isDlsuSchool(s) ? 0.65 : 0.35 / (schools.length - 1)))
    );
    const processed = chance(0.6);
    const processedBy = processed
      ? pick(schoolAccounts.filter((a) => a.schoolId === school.uid)).id
      : undefined;
    const processedDate = processed ? tsOffsetDays(-randInt(0, 45)) : undefined;
    const resultAction = processed
      ? pick(["approved", "denied", "continuedDialogue"] as const)
      : undefined;
    return {
      messageID: id(),
      entityID: e.uid,
      schoolID: school.uid,
      notifySchoolAccount: pick(schoolAccounts.filter((a) => a.schoolId === school.uid)).id,
      processedBy,
      processedDate,
      resultAction,
      timestamp: tsOffsetDays(-randInt(0, 60)),
    };
  });

  /** Generate: Documents (base + signed) */
  const baseDocuments: BaseDocument[] = [];
  const signedDocuments: SignedDocument[] = [];

  for (let i = 0; i < COUNTS.signedDocs; i++) {
    const baseId = id();
    baseDocuments.push({
      uid: baseId,
      url: `/docs/mock/moa/dlsu-moa-${i + 1}.pdf`,
    });
    const partiesCount = randInt(1, 3);
    const parties = Array.from({ length: partiesCount }).map(() => ({
      name: personName(),
      email: chance(0.7) ? emailFor(personName(), "example.com") : undefined,
    }));
    signedDocuments.push({
      base_document_id: baseId,
      document_verification_code: verificationCode(),
      parties,
      type: pick(["Standard MOA", "Addendum", "NDA", "LOI"]),
      notarized_link: chance(0.6) ? `/docs/mock/notaries/notary-${i + 1}.pdf` : null,
      effective_date: tsOffsetDays(-randInt(10, 180)),
      expiry_date: chance(0.5) ? tsOffsetDays(randInt(30, 365)) : null,
      inputs: chance(0.45)
        ? { term_months: String(randInt(6, 24)), internship_slots: String(randInt(3, 50)) }
        : undefined,
      inputs_hash: chance(0.4) ? hashSmall(JSON.stringify({ i })) : undefined,
    });
  }

  /** Mock entity accounts (after entities exist) */
  const entityAccounts: EntityAccount[] = [
    {
      id: id(),
      entityId: entities[0]?.uid || "entity-1",
      email: "isabel@aurora.com",
      name: "Isabel Reyes",
      password: "pass1234",
      role: "admin",
    },
    {
      id: id(),
      entityId: entities[1]?.uid || "entity-2",
      email: "ops@example.com",
      name: "Operations Team",
      password: "password",
      role: "member",
    },
  ];

  /** Derived lookups & helpers (bound to this dataset) */
  function listEntities(params?: { q?: string; limit?: number; offset?: number }) {
    const q = (params?.q ?? "").toLowerCase();
    let out = entities;
    if (q) {
      out = out.filter(
        (e) =>
          e.displayName.toLowerCase().includes(q) ||
          e.legalName.toLowerCase().includes(q) ||
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
    const row: EntityLog = { uuid: id(), timestamp: log.timestamp ?? now(), ...log };
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

  function findEntityById(uid: UUID) {
    return entities.find((e) => e.uid === uid) || null;
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
    // dlsu helpers
    getDlsu,
    isDlsuSchool,
  };
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  HMR-safe global singleton + re-exports
 *  ────────────────────────────────────────────────────────────────────────────*/
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
  getDlsu,
  isDlsuSchool,
} = DB;

/** ─────────────────────────────────────────────────────────────────────────────
 *  RNG + tiny hashes (private)
 *  ────────────────────────────────────────────────────────────────────────────*/
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
