import { NextResponse } from "next/server";
import { readCache, writeCache } from "@/lib/cache";
import { fetchBradshawReviews } from "@/lib/guardian";
import { batchLookupStreaming } from "@/lib/streaming";

export async function GET() {
  try {
    // Check cache first
    const cached = readCache();
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch reviews from Guardian
    const reviews = await fetchBradshawReviews();

    // Look up streaming availability with year hints from review dates
    const items = reviews.map((r) => ({
      title: r.title,
      releaseYearHint: new Date(r.reviewDate).getFullYear(),
    }));
    const streamingMap = await batchLookupStreaming(items);
    const pendingLookups: string[] = [];

    for (const review of reviews) {
      if (streamingMap.has(review.title)) {
        review.platforms = streamingMap.get(review.title) || [];
      } else {
        pendingLookups.push(review.title);
      }
    }

    const cacheData = {
      lastUpdated: new Date().toISOString(),
      reviews,
      pendingLookups,
    };

    writeCache(cacheData);
    return NextResponse.json(cacheData);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
