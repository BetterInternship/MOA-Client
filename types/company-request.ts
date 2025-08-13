// types/company-request.ts
export type RequestStatus = "Pending" | "Needs Info" | "Approved" | "Denied";

export type CompanyRequest = {
  id: string; // messageID
  entityId: string; // DB entityID
  companyName: string;
  contactPerson?: string | null;
  email?: string | null;
  tin?: string | null;
  industry?: string | null;

  submittedAt: string; // ISODate
  status: RequestStatus;
  notes?: string; // last action note / RFI message (mock)

  // either of these will work with your DocumentsCard mapping
  documents?: { label?: string; href?: string }[];
  entityDocuments?: { documentType: string; url: string }[];
};
