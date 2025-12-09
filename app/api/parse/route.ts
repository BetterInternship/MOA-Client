import { NextRequest, NextResponse } from "next/server";
import { processJsonData } from "@/lib/dataProcessor";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const processed = processJsonData(json);
    return NextResponse.json(processed);
  } catch (error) {
    console.error("Error processing JSON:", error);
    return NextResponse.json(
      { error: "Failed to process JSON data" },
      { status: 400 }
    );
  }
}
