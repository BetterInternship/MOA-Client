export type MoaStatus = "Pending" | "Needs Info" | "Under Review" | "Approved" | "Denied" | "Registered" | "Blacklisted" ;

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
  entity_id: string;
  school_id: string;
  status: string;
  timestamp: string;
};
