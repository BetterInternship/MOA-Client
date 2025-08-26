// hooks/useCompanyDetail.ts
"use client";

import type { Entity, URLString, ISODate } from "@/types/db";
import type { MoaHistoryFile } from "@/types/moa-request";

/* ---------------- helpers ---------------- */

const firstNonEmpty = (...vals: (string | undefined | null)[]) =>
  vals.find((v) => v !== undefined && v !== null && String(v).trim() !== "") ?? "";

const toMDY = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// backend → status *key* we can style on (lowercase)
type BackendMoa = string | null | undefined;
const toStatusKey = (s?: BackendMoa) => (s ?? "").toString().trim().toLowerCase();

// status label for human display
const toStatusLabel = (key: string): string => {
  switch (key) {
    case "approved":
      return "Approved";
    case "registered":
    case "pending":
      return "Registered";
    case "blacklisted":
    case "denied":
    case "rejected":
      return "Blacklisted";
    default:
      return "Under Review";
  }
};

const fileToHistoryFile = (url: URLString, stamp: ISODate): MoaHistoryFile => {
  const name = url.split("/").pop() || "file";
  return { id: `${stamp}-${name}`, name, url };
};

// Parses history that may arrive as:
// - an array of objects
// - a JSON string with single quotes: "[{'effective_date':'..','documents':'url1,url2'}]"
// - a JSON string with normal double quotes
const parseHistoryArray = (raw: unknown): any[] => {
  if (Array.isArray(raw)) return raw;
  if (raw == null) return [];

  if (typeof raw === "string") {
    let s = raw.trim();

    // strip one wrapping layer of quotes, if present
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1);
    }

    // convert single-quoted JSON into valid JSON
    const looksSingleQuoted = s.includes("':") || s.startsWith("[{'");
    const jsonish = looksSingleQuoted ? s.replace(/'/g, '"') : s;

    try {
      const parsed = JSON.parse(jsonish);
      return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    } catch {
      return [];
    }
  }

  // object → single-element array
  if (typeof raw === "object") return [raw as any];
  return [];
};

// Turn documents into an array of URLs. Supports:
// - comma/semicolon/whitespace-separated string
// - already an array
const explodeDocuments = (docs: unknown): URLString[] => {
  if (!docs) return [];
  if (Array.isArray(docs)) {
    return (docs as unknown[])
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean) as URLString[];
  }
  return String(docs)
    .split(/[,\s;]+/)
    .map((s) => s.trim())
    .filter(Boolean) as URLString[];
};

/** Normalize server history into { timestamp, text, files? }[] */
const normalizeHistoryItems = (
  raw: any
): Array<{ timestamp: ISODate; text: string; files?: URLString[] }> => {
  const arr = parseHistoryArray(raw);

  return arr
    .map((it: any) => {
      // Preferred shape
      if (it?.timestamp && it?.text) {
        const docs = explodeDocuments(it?.documents);
        const files = Array.isArray(it?.files) && it.files.length ? it.files : docs;
        return {
          timestamp: new Date(it.timestamp).toISOString(),
          text: String(it.text),
          files: files && files.length ? (files as URLString[]) : undefined,
        };
      }

      // Legacy master-sheet shape with effective/expiry + documents
      if (it?.effective_date || it?.expiry_date) {
        const docs = explodeDocuments(it?.documents);
        const files = docs.length ? (docs as URLString[]) : undefined;
        const out: Array<{ timestamp: ISODate; text: string; files?: URLString[] }> = [];

        if (it.effective_date) {
          out.push({
            timestamp: new Date(it.effective_date).toISOString(),
            text: "MOA effective date set",
            files,
          });
        }
        if (it.expiry_date) {
          out.push({
            timestamp: new Date(it.expiry_date).toISOString(),
            text: "MOA expiry date set",
            files,
          });
        }
        return out;
      }

      // Fallback
      return {
        timestamp: new Date().toISOString(),
        text: JSON.stringify(it),
      };
    })
    .flat();
};

/* ---------------- hook ---------------- */

export function useCompanyDetail(company?: Entity) {
  // ! to implement
}
