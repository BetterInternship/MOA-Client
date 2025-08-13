// types/moa.ts
export type MoaStatus =
  | "Approved"
  | "Pending"
  | "Rejected"
  | "Under Review"
  | "Needs Info"
  | "Active"
  | "Inactive";

export type RequestTypeLabel = "Standard MOA" | "Negotiated MOA" | "Company Approval" | string;

export type MoaItem = {
  id: string;
  request: string; // e.g., "MOA with DLSU (AY 2025–2026)"
  type: RequestTypeLabel; // "Standard MOA" | "Negotiated MOA" | "Company Approval"
  submittedAt: string; // preformatted date string
  status: MoaStatus; // now supports "Active" | "Inactive"
  // (Optional extras; ignored by the one-card view)
  currentStep?: string;
  lastUpdate?: string;
  nextAction?: string;
  approver?: string;
  filesCount?: number;
};
