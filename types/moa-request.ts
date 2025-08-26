export type MoaStatus =
  | "Pending"
  | "Needs Info"
  | "Under Review"
  | "Approved"
  | "Denied"
  | "Registered"
  | "Blacklisted";

export type MoaHistoryItem = {
  date: string; // MM/DD/YYYY
  text: string; // event/notes
  files?: MoaHistoryFile[];
};
