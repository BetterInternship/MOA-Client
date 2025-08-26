// types/company-request.ts
export type CompanyRequestStatus = "pending" | "approved" | "denied" | "conversing";

export type CompanyRequest = {
  id: string;
  entity_id: string;

  // what the UI uses
  companyName: string;
  contactPerson: string;
  email: string;
  submittedAt: string; // MM/DD/YYYY
  status: CompanyRequestStatus;
  reason?: string;

  // optional meta
  processedBy?: string;
  processedAt?: string;

  entity?: {
    id: string;
    display_name?: string;
    legal_identifier?: string;
    contact_name?: string;
    contact_email?: string;
    type?: string;
  };
};
