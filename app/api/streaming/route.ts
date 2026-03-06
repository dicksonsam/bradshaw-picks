import { NextRequest, NextResponse } from "next/server";
import { lookupStreaming } from "@/lib/streaming";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  if (!title) {
    return NextResponse.json({ error: "title parameter required" }, { status: 400 });
  }

  try {
    const platforms = await lookupStreaming(title);
    return NextResponse.json({ title, platforms });
  } catch (error) {
    console.error("Streaming lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up streaming availability" },
      { status: 500 }
    );
  }
}
