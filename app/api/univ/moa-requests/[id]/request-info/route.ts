// app/api/univ/moa-requests/[id]/request-info/route.ts
import { NextResponse } from "next/server";
import { moaRequests, schoolAccounts } from "@/lib/mock/db";
import { GET as listGET } from "../../route";
import { DemoStore } from "@/lib/demo-store";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params; // messageID
  const body = await req.json().catch(() => ({}));
  const message: string | undefined = body?.message;

  const row = moaRequests.find((r) => r.messageID === id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actor = schoolAccounts.find((a) => a.receiveMoaRequests) ?? schoolAccounts[0];

  row.processedBy = actor?.id;
  row.processedDate = new Date().toISOString();
  row.resultAction = "continuedDialogue";
  (row as any).notes = message ?? "Please clarify the signatory and attach the notarized page.";

  const h = ((row as any).history ?? []) as Array<any>;
  h.push({
    date: new Date().toISOString(),
    text: "University requested clarification",
    sourceType: "univ",
    comment: (row as any).notes,
  });
  (row as any).history = h;

  DemoStore.setStage(1);

  const res = await listGET(new Request(new URL(req.url).origin + "/api/univ/moa-requests"));
  const js = await res.json();
  const item = js.items.find((x: any) => x.id === id);

  return NextResponse.json({ item }, { headers: { "Cache-Control": "no-store" } });
}
