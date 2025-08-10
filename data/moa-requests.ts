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
      {
        date: "01/28/2025",
        text: "MOA request submitted (Standard MOA).",
        files: [
          {
            id: "std-moa-template",
            name: "Standard_MOA_Template.pdf",
            url: "/files/aurora/Standard_MOA_Template.pdf",
          },
          {
            id: "company-profile",
            name: "Company_Profile.pdf",
            url: "/files/aurora/Company_Profile.pdf",
          },
        ],
      },
      {
        date: "01/29/2025",
        text: "Initial screening completed by Univ Coordinator.",
      },
      {
        date: "01/31/2025",
        text: "Requested company docs: SEC Reg + BIR 2303.",
        files: [
          {
            id: "sec-reg",
            name: "SEC_Registration.pdf",
            url: "/files/aurora/SEC_Registration.pdf",
          },
          { id: "bir-2303", name: "BIR_2303.pdf", url: "/files/aurora/BIR_2303.pdf" },
        ],
      },
      {
        date: "02/02/2025",
        text: "Uploaded MOA draft v2 for review.",
        files: [
          {
            id: "moa-draft-v2-docx",
            name: "MOA_Draft_v2.docx",
            url: "/files/aurora/MOA_Draft_v2.docx",
          },
          {
            id: "moa-draft-v2-pdf",
            name: "MOA_Draft_v2.pdf",
            url: "/files/aurora/MOA_Draft_v2.pdf",
          },
        ],
      },
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
      {
        date: "02/10/2025",
        text: "MOA request submitted (Negotiated MOA).",
        files: [
          {
            id: "neg-terms",
            name: "Negotiated_Terms_Draft.docx",
            url: "/files/northbridge/Negotiated_Terms_Draft.docx",
          },
          { id: "annex-a", name: "Annex_A_Scope.pdf", url: "/files/northbridge/Annex_A_Scope.pdf" },
        ],
      },
      {
        date: "02/11/2025",
        text: "Returned: Please attach signatory authority.",
      },
      {
        date: "02/12/2025",
        text: "Company uploaded signatory authority document.",
        files: [
          {
            id: "signatory-auth",
            name: "Signatory_Authority.pdf",
            url: "/files/northbridge/Signatory_Authority.pdf",
          },
        ],
      },
      {
        date: "02/13/2025",
        text: "Re-uploaded MOA draft with corrections.",
        files: [
          {
            id: "moa-draft-corr",
            name: "MOA_Draft_Corrected.pdf",
            url: "/files/northbridge/MOA_Draft_Corrected.pdf",
          },
        ],
      },
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
    history: [
      {
        date: "01/05/2025",
        text: "MOA request submitted (Standard MOA).",
        files: [
          {
            id: "std-moa-template",
            name: "Standard_MOA_Template.pdf",
            url: "/files/greenfields/Standard_MOA_Template.pdf",
          },
        ],
      },
      {
        date: "01/06/2025",
        text: "Uploaded compliance documents.",
        files: [
          {
            id: "comp-cert",
            name: "Compliance_Certificate.pdf",
            url: "/files/greenfields/Compliance_Certificate.pdf",
          },
          {
            id: "insurance",
            name: "Employer_Insurance.pdf",
            url: "/files/greenfields/Employer_Insurance.pdf",
          },
        ],
      },
    ],
  },
];
