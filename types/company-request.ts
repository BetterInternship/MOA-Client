export type RequestStatus = "Pending" | "Needs Info" | "Approved" | "Denied";

export type CompanyRequest = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  tin: string;
  industry: string;
  submittedAt: string; // MM/DD/YYYY
  reason: string;
  status: RequestStatus;
};
