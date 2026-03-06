import { NextResponse } from "next/server";
import { readCache } from "@/lib/cache";

export async function GET() {
  const cached = readCache();
  if (cached) {
    return NextResponse.json(cached);
  }
  return NextResponse.json({ lastUpdated: "", reviews: [] });
}
