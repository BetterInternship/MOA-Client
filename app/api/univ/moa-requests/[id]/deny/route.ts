// app/api/univ/moa-requests/[id]/deny/route.ts
import { NextResponse } from "next/server";
import { moaRequests, schoolAccounts } from "@/lib/mock/db";
import { GET as listGET } from "../../route";
import { DemoStore } from "@/lib/demo-store";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const note: string | undefined = body?.note;

  const row = moaRequests.find((r) => r.messageID === id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actor = schoolAccounts.find((a) => a.receiveMoaRequests) ?? schoolAccounts[0];

  row.processedBy = actor?.id;
  row.processedDate = new Date().toISOString();
  row.resultAction = "denied";
  (row as any).notes = note ?? "Denied";

  const h = ((row as any).history ?? []) as Array<any>;
  h.push({
    date: new Date().toISOString(),
    text: "MOA denied",
    sourceType: "univ",
    comment: (row as any).notes,
  });
  (row as any).history = h;

  DemoStore.setStage(0);

  const res = await listGET(new Request(new URL(req.url).origin + "/api/univ/moa-requests"));
  const js = await res.json();
  const item = js.items.find((x: any) => x.id === id);

  return NextResponse.json({ item }, { headers: { "Cache-Control": "no-store" } });
}
