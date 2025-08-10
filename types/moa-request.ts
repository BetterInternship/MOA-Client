export type MoaStatus = "Pending" | "Needs Info" | "Under Review" | "Approved" | "Denied";

export type MoaHistoryItem = {
  date: string; // MM/DD/YYYY
  text: string;
};

export type MoaRequest = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  tin: string;
  industry: string;
  requestedAt: string; // MM/DD/YYYY
  status: MoaStatus;
  notes?: string;
  history: MoaHistoryItem[];
};
