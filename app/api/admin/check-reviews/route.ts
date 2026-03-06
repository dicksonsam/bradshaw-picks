import { readCache, writeCache, mergeReviews } from "@/lib/cache";
import { fetchBradshawReviews } from "@/lib/guardian";
import { createSSEResponse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  return createSSEResponse(async (send) => {
    const cache = readCache();
    const existingReviews = cache?.reviews ?? [];

    // Find most recent review date to use as fromDate
    let fromDate: string | undefined;
    if (existingReviews.length > 0) {
      const dates = existingReviews.map((r) => new Date(r.reviewDate).getTime());
      const mostRecent = new Date(Math.max(...dates));
      fromDate = mostRecent.toISOString().split("T")[0];
    }

    send({ type: "progress", message: fromDate ? `Checking for reviews since ${fromDate}...` : "Fetching all reviews..." });

    const incoming = await fetchBradshawReviews(fromDate);
    const merged = mergeReviews(existingReviews, incoming);
    const newCount = merged.length - existingReviews.length;

    writeCache({
      lastUpdated: new Date().toISOString(),
      reviews: merged,
    });

    send({
      type: "complete",
      message: newCount > 0
        ? `Found ${newCount} new review${newCount === 1 ? "" : "s"}.`
        : "No new reviews found.",
    });
  });
}
