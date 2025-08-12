export type Company = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  tin: string;
  industry: string;
  reason?: string;
  date: string; // MM/DD/YYYY
  moaStatus: "registered" | "approved" | "blacklisted";
  validUntil?: string; // MM/DD/YY
  documents: { label: string; href: string }[];
  activity: { date: string; text: string }[];
};
