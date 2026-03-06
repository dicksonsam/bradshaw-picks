import { NextResponse } from "next/server";
import { clearCache, writeCache } from "@/lib/cache";
import { fetchBradshawReviews } from "@/lib/guardian";
import { batchLookupStreaming } from "@/lib/streaming";

export async function POST() {
  try {
    clearCache();

    const reviews = await fetchBradshawReviews();
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
    console.error("Error refreshing data:", error);
    return NextResponse.json(
      { error: "Failed to refresh data" },
      { status: 500 }
    );
  }
}
