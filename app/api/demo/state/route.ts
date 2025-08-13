// app/api/demo/state/route.ts  (UNIV APP)
import { NextResponse } from "next/server";
import { DemoStore } from "@/lib/demo-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  return NextResponse.json(DemoStore.get(), {
    headers: { ...CORS, "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { stage, signatory } = body ?? {};
  if (typeof stage === "number") DemoStore.setStage(stage);
  if (signatory?.name && signatory?.title) DemoStore.setSignatory(signatory.name, signatory.title);
  return NextResponse.json(DemoStore.get(), {
    headers: { ...CORS, "Cache-Control": "no-store" },
  });
}
