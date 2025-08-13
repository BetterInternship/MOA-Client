// app/api/univ/requests/[id]/request-info/route.ts
import { NextResponse } from "next/server";
import { newEntityRequests, schoolAccounts } from "@/lib/mock/db";
import { GET as listGET } from "../../route"; // reuse mapper for response

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params; // messageID
  const body = await req.json().catch(() => ({}));
  const message: string | undefined = body?.message;

  const row = newEntityRequests.find((r) => r.messageID === id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actor = schoolAccounts.find((a) => a.receiveNewOrgRequests) ?? schoolAccounts[0];

  // Mark as continued dialogue (Needs Info)
  row.processedBy = actor?.id;
  row.processedDate = new Date().toISOString();
  row.resultAction = "continuedDialogue";

  // Store mock note on the in-memory object (not part of strict type)
  (row as any).notes = message ?? "Please provide the latest business permit.";

  // Return the updated single item using the same mapping as list
  const res = await listGET(new Request(new URL(req.url).origin + "/api/univ/requests"));
  const js = await res.json();
  const item = js.items.find((x: any) => x.id === id);

  return NextResponse.json({ item }, { headers: { "Cache-Control": "no-store" } });
}
