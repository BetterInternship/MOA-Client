import { Company } from "@/types/company";

export const companies: Company[] = [
  {
    id: "VXZb0VYY2JqPC2ZKyEQHr",
    name: "Aurora Systems",
    contactPerson: "Isabel Reyes",
    email: "isabel.reyes@aurorasystems.ph",
    tin: "453-219-874-000",
    industry: "IT Services",
    reason:
      "We're looking to cultivate a strong local talent pipeline and offer students exposure to enterprise-scale IT systems early in their careers.",
    date: "12/02/2024",
    moaStatus: "Active",
    validUntil: "02/15/26",
    documents: [
      { label: "Business Permit", href: "/docs/aurora/business-permit.pdf" },
      { label: "Company Incorporation", href: "/docs/aurora/incorporation.pdf" },
      { label: "BIR Permit", href: "/docs/aurora/bir-permit.pdf" },
    ],
    activity: [
      { date: "08/21/2024", text: "MOA Renewed" },
      { date: "01/20/2023", text: "MOA Renewed" },
      { date: "12/10/2022", text: "MOA Requested" },
      { date: "12/01/2022", text: "Company Registered" },
    ],
  },
  {
    id: "northbridge",
    name: "Northbridge Finance",
    contactPerson: "Katrina Uy",
    email: "katrina.uy@northbridge.com",
    tin: "123-456-789-000",
    industry: "Finance",
    date: "02/01/2025",
    moaStatus: "Under Review",
    documents: [{ label: "Company Profile", href: "/docs/northbridge/profile.pdf" }],
    activity: [
      { date: "02/05/2025", text: "Legal Review Started" },
      { date: "02/01/2025", text: "MOA Request (Negotiated) Submitted" },
    ],
  },
  {
    id: "greenfields",
    name: "GreenFields Manufacturing",
    contactPerson: "Carlos Mendoza",
    email: "carlos.mendoza@greenfields.ph",
    tin: "987-654-321-000",
    industry: "Manufacturing",
    date: "01/15/2025",
    moaStatus: "Active",
    validUntil: "01/15/27",
    documents: [{ label: "Environmental Clearance", href: "/docs/greenfields/denr.pdf" }],
    activity: [
      { date: "01/18/2025", text: "Initial Review Completed" },
      { date: "01/15/2025", text: "MOA Request (Standard) Received" },
    ],
  },
  {
    id: "pacificreach",
    name: "Pacific Reach Logistics",
    contactPerson: "Jorge Santos",
    email: "jorge.santos@pacificreach.com",
    tin: "652-314-987-000",
    industry: "Logistics & Supply Chain",
    reason:
      "Seeking partnership to place OJT students in warehouse operations and supply chain optimization projects.",
    date: "11/10/2024",
    moaStatus: "Active",
    validUntil: "11/10/2026",
    documents: [
      { label: "Business Permit", href: "/docs/pacificreach/business-permit.pdf" },
      { label: "DTI Registration", href: "/docs/pacificreach/dti.pdf" },
    ],
    activity: [
      { date: "11/15/2024", text: "MOA Signed" },
      { date: "11/10/2024", text: "Company Registered" },
    ],
  },
  {
    id: "manilamedical",
    name: "Manila Medical Solutions",
    contactPerson: "Dr. Felicia Cruz",
    email: "felicia.cruz@manilamedical.com.ph",
    tin: "754-198-223-000",
    industry: "Healthcare",
    reason:
      "Partnering to provide internships for nursing, pharmacy, and medical technology students.",
    date: "09/05/2024",
    moaStatus: "Expired",
    validUntil: "09/05/2022",
    documents: [
      { label: "DOH Accreditation", href: "/docs/manilamedical/doh.pdf" },
      { label: "Business Permit", href: "/docs/manilamedical/business-permit.pdf" },
    ],
    activity: [
      { date: "09/10/2022", text: "MOA Signed" },
      { date: "09/05/2024", text: "MOA Expired" },
    ],
  },
  {
    id: "freshharvest",
    name: "Fresh Harvest Foods Corp.",
    contactPerson: "Angela Bautista",
    email: "angela.bautista@freshharvest.ph",
    tin: "821-457-693-000",
    industry: "Food & Beverage",
    reason:
      "Looking for students in food technology and marketing for new product development campaigns.",
    date: "08/12/2024",
    moaStatus: "Under Review",
    documents: [{ label: "FDA License", href: "/docs/freshharvest/fda.pdf" }],
    activity: [
      { date: "08/14/2024", text: "Initial Review Completed" },
      { date: "08/12/2024", text: "MOA Request Submitted" },
    ],
  },
  {
    id: "citrusinnovations",
    name: "Citrus Innovations Inc.",
    contactPerson: "Luis Fernandez",
    email: "luis.fernandez@citrusinnovations.com",
    tin: "453-872-315-000",
    industry: "Renewable Energy",
    reason:
      "Providing opportunities for engineering students to work on sustainable energy projects and research.",
    date: "10/20/2024",
    moaStatus: "Active",
    validUntil: "10/20/2026",
    documents: [
      { label: "SEC Registration", href: "/docs/citrusinnovations/sec.pdf" },
      { label: "DOE Accreditation", href: "/docs/citrusinnovations/doe.pdf" },
    ],
    activity: [
      { date: "10/25/2024", text: "MOA Signed" },
      { date: "10/20/2024", text: "Company Registered" },
    ],
  },
];
