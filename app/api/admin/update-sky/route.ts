import { readCache, writeCache } from "@/lib/cache";
import { createSSEResponse } from "@/lib/sse";
import { skyLookupWithProgress } from "@/lib/sky-lookup";
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
        : reviews.filter((r) => !r.platforms.includes("now"));

    if (targets.length === 0) {
      send({ type: "complete", message: "No reviews to check for Sky/Now." });
      return;
    }

    const items = targets.map((r) => ({ title: r.title }));

    // Build a map from title to review indices for fast updates
    const titleToIndices = new Map<string, number[]>();
    for (let i = 0; i < reviews.length; i++) {
      const t = reviews[i].title;
      if (!titleToIndices.has(t)) titleToIndices.set(t, []);
      titleToIndices.get(t)!.push(i);
    }

    let checkedCount = 0;
    let foundCount = 0;

    await skyLookupWithProgress(
      items,
      (checked, total, title, found) => {
        checkedCount = checked;
        if (found) foundCount++;

        // Update all reviews with this title
        if (found) {
          const indices = titleToIndices.get(title) ?? [];
          for (const idx of indices) {
            if (!reviews[idx].platforms.includes("now")) {
              reviews[idx].platforms.push("now");
            }
          }
        }

        send({
          type: "progress",
          checked,
          total,
          message: `${checked}/${total}: ${title} — ${found ? "on Sky/Now" : "not found"}`,
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
      send({ type: "complete", message: `Cancelled after ${checkedCount} of ${items.length} lookups. Found ${foundCount} on Sky/Now. Progress saved.` });
    } else {
      send({ type: "complete", checked: items.length, total: items.length, message: `Done. Checked ${items.length} titles, found ${foundCount} on Sky/Now.` });
    }
  });
}
