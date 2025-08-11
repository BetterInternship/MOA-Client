import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const serial = (req.nextUrl.searchParams.get("serial") || "").trim();
  if (!serial) {
    return NextResponse.json({ error: "Missing serial" }, { status: 400 });
  }

  // Demo data — replace with your DB/service lookup
  const s = serial.toUpperCase();

  if (s === "DLSU-2025-ABC123") {
    return NextResponse.json({
      status: "valid",
      serial: s,
      documentTitle: "Standard MOA between DLSU and Aurora Systems",
      signedAt: "2025-07-30T09:42:00+08:00",
      signatories: [
        { name: "Dr. Maria Santos", title: "University Legal Counsel" },
        { name: "Isabel Reyes", title: "Authorized Company Signatory" },
      ],
      notarizedBy: [{ name: "Atty. Liza Mendoza", title: "Notary Public" }],

      organization: "De La Salle University",
      sha256: "f3b1…9c7a",
      viewUrl: "/api/documents/DLSU-2025-ABC123/view",
      downloadUrl: "/api/documents/DLSU-2025-ABC123/download",
      meta: {
        "Document Type": "Memorandum of Agreement",
        Version: "1.0",
        "Valid Until": "2027-07-30",
      },
    });
  }

  if (s === "DLSU-2025-REVOKE1") {
    return NextResponse.json({
      status: "revoked",
      serial: s,
      documentTitle: "Standard MOA between DLSU and Example Corp",
      signedAt: "2025-05-12T14:10:00+08:00",
      signatories: [{ name: "Atty. Jose Cruz", title: "DLSU Legal" }],
      organization: "De La Salle University",
      viewUrl: "/api/documents/DLSU-2025-REVOKE1/view",
      meta: { Reason: "Superseded by Addendum 2" },
    });
  }

  return NextResponse.json({ status: "not_found" });
}
