export type MoaStatus = "Pending" | "Needs Info" | "Under Review" | "Approved" | "Denied";

export type MoaHistoryFile = {
  id: string; // stable id for selection
  name: string; // suggested filename
  url: string; // direct file URL (same-origin or CORS-enabled)
};

export type MoaHistoryItem = {
  date: string; // MM/DD/YYYY
  text: string; // event/notes
  files?: MoaHistoryFile[];
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
