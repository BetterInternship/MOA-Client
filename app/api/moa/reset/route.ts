// app/api/moa/reset/route.ts
import { NextResponse } from "next/server";
import { DemoStore } from "@/lib/demo-store";

export async function POST() {
  DemoStore.reset(); // 👈 make sure DemoStore has a reset() method
  return NextResponse.json({ ok: true });
}
