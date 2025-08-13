// app/api/moa/submit/route.ts
import { NextResponse } from "next/server";
import { DemoStore } from "@/lib/demo-store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  DemoStore.setSignatory(String(body?.name ?? ""), String(body?.title ?? ""));
  DemoStore.setStage(1);
  return NextResponse.json({ ok: true, stage: 1 });
}
