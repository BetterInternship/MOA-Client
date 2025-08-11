export type ValidVerification = {
  status: "valid" | "revoked";
  serial: string;
  documentTitle: string;
  signedAt: string; // ISO string
  signatories: { name: string; title?: string }[];
  notarizedBy: { name: string; title?: string }[];
  organization: string;
  sha256?: string;
  viewUrl: string;
  downloadUrl?: string;
  meta?: Record<string, string>;
};

export type VerificationResponse = ValidVerification | { status: "not_found" };
