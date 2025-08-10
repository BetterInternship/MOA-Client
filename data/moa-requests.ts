import { MoaRequest } from "@/types/moa-request";

export const MOA_REQUESTS: MoaRequest[] = [
  {
    id: "aurora",
    companyName: "Aurora Systems",
    contactPerson: "Isabel Reyes",
    email: "isabel.reyes@aurorasystems.ph",
    tin: "453-219-874-000",
    industry: "IT Services",
    requestedAt: "01/28/2025",
    status: "Under Review",
    notes: "MOA v2 template requested.",
    history: [
      { date: "01/28/2025", text: "MOA request submitted (Standard MOA)." },
      { date: "01/29/2025", text: "Initial screening completed by Univ Coordinator." },
      { date: "01/31/2025", text: "Requested company docs: SEC Reg + BIR 2303." },
    ],
  },
  {
    id: "northbridge",
    companyName: "Northbridge Finance",
    contactPerson: "Katrina Uy",
    email: "katrina.uy@northbridge.com",
    tin: "123-456-789-000",
    industry: "Finance",
    requestedAt: "02/10/2025",
    status: "Needs Info",
    notes: "Missing signature page.",
    history: [
      { date: "02/10/2025", text: "MOA request submitted (Negotiated MOA)." },
      { date: "02/11/2025", text: "Returned: Please attach signatory authority." },
    ],
  },
  {
    id: "greenfields",
    companyName: "GreenFields Manufacturing",
    contactPerson: "Carlos Mendoza",
    email: "carlos.mendoza@greenfields.ph",
    tin: "987-654-321-000",
    industry: "Manufacturing",
    requestedAt: "01/05/2025",
    status: "Pending",
    history: [{ date: "01/05/2025", text: "MOA request submitted (Standard MOA)." }],
  },
];
