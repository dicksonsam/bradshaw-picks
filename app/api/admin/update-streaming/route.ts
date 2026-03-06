import { readCache, writeCache } from "@/lib/cache";
import { createSSEResponse } from "@/lib/sse";
import { streamingLookupWithProgress } from "@/lib/streaming";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") ?? "pending";

  return createSSEResponse(async (send, signal) => {
    const cache = readCache();
    if (!cache || cache.reviews.length === 0) {
      send({ type: "error", message: "No reviews in cache. Check for reviews first." });
      return;
    }

    const reviews = cache.reviews;
    const targets =
      mode === "all"
        ? reviews
        : reviews.filter((r) => r.platforms.length === 0);

    if (targets.length === 0) {
      send({ type: "complete", message: "No reviews to update." });
      return;
    }

    const items = targets.map((r) => ({
      title: r.title,
      releaseYearHint: new Date(r.reviewDate).getFullYear(),
    }));

    // Build a map from title to review indices for fast updates
    const titleToIndices = new Map<string, number[]>();
    for (let i = 0; i < reviews.length; i++) {
      const t = reviews[i].title;
      if (!titleToIndices.has(t)) titleToIndices.set(t, []);
      titleToIndices.get(t)!.push(i);
    }

    let checkedCount = 0;

    await streamingLookupWithProgress(
      items,
      (checked, total, title, platforms) => {
        checkedCount = checked;

        // Update all reviews with this title
        const indices = titleToIndices.get(title) ?? [];
        for (const idx of indices) {
          reviews[idx].platforms = platforms;
        }

        send({
          type: "progress",
          checked,
          total,
          message: `${checked}/${total}: ${title} — ${platforms.length > 0 ? platforms.join(", ") : "not streaming"}`,
        });

        // Periodic cache write every 10 items
        if (checked % 10 === 0) {
          writeCache({ lastUpdated: new Date().toISOString(), reviews });
        }
      },
      signal
    );

    // Final cache write
    writeCache({ lastUpdated: new Date().toISOString(), reviews });

    if (signal.aborted) {
      send({ type: "complete", message: `Cancelled after ${checkedCount} of ${items.length} lookups. Progress saved.` });
    } else {
      send({ type: "complete", checked: items.length, total: items.length, message: `Done. Updated streaming info for ${items.length} reviews.` });
    }
  });
}
