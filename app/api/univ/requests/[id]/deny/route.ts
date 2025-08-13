// app/api/univ/requests/[id]/deny/route.ts
import { NextResponse } from "next/server";
import { newEntityRequests, schoolAccounts } from "@/lib/mock/db";
import { GET as listGET } from "../../route";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const note: string | undefined = body?.note;

  const row = newEntityRequests.find((r) => r.messageID === id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actor = schoolAccounts.find((a) => a.receiveNewOrgRequests) ?? schoolAccounts[0];

  row.processedBy = actor?.id;
  row.processedDate = new Date().toISOString();
  row.resultAction = "denied";
  (row as any).notes = note ?? "Denied";

  const res = await listGET(new Request(new URL(req.url).origin + "/api/univ/requests"));
  const js = await res.json();
  const item = js.items.find((x: any) => x.id === id);

  return NextResponse.json({ item }, { headers: { "Cache-Control": "no-store" } });
}
