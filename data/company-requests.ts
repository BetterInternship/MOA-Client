import { CompanyRequest } from "@/types/company-request";

export const REQUESTS: CompanyRequest[] = [
  {
    id: "aurora",
    companyName: "Aurora Systems",
    contactPerson: "Isabel Reyes",
    email: "isabel.reyes@aurorasystems.ph",
    tin: "453-219-874-000",
    industry: "IT Services",
    submittedAt: "12/02/2024",
    reason:
      "We’re looking to cultivate a strong local talent pipeline and offer students exposure to enterprise-scale IT systems early in their careers.",
    status: "Pending",
  },
  {
    id: "northbridge",
    companyName: "Northbridge Finance",
    contactPerson: "Katrina Uy",
    email: "katrina.uy@northbridge.com",
    tin: "123-456-789-000",
    industry: "Finance",
    submittedAt: "02/01/2025",
    reason: "Seeking interns for risk analytics and compliance process automation.",
    status: "Needs Info",
  },
  {
    id: "greenfields",
    companyName: "GreenFields Manufacturing",
    contactPerson: "Carlos Mendoza",
    email: "carlos.mendoza@greenfields.ph",
    tin: "987-654-321-000",
    industry: "Manufacturing",
    submittedAt: "01/15/2025",
    reason: "Expanding engineering internship program for production optimization.",
    status: "Pending",
  },
];
