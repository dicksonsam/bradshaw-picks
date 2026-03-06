const API_BASE = "https://streaming-availability.p.rapidapi.com";
const SERVICE_IDS = ["netflix", "prime", "disney", "apple", "now"];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(searched: string, returned: string): boolean {
  const a = normalise(searched);
  const b = normalise(returned);

  // Exact match after normalisation
  if (a === b) return true;

  // One contains the other fully (handles subtitle differences)
  if (a.length >= 3 && (b.startsWith(a) || a.startsWith(b))) return true;

  return false;
}

export async function lookupStreaming(
  title: string,
  releaseYearHint?: number
): Promise<string[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) throw new Error("RAPIDAPI_KEY not set");

  try {
    const params = new URLSearchParams({
      title,
      country: "gb",
      show_type: "movie",
    });

    const res = await fetch(`${API_BASE}/shows/search/title?${params}`, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com",
      },
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`Rate limited on: ${title}`);
        return [];
      }
      console.warn(`Streaming API error for "${title}": ${res.status}`);
      return [];
    }

    const data = await res.json();
    const shows = Array.isArray(data) ? data : [];
    if (shows.length === 0) return [];

    // Find the best matching show rather than blindly taking the first
    for (const show of shows) {
      const returnedTitle = show?.title || "";

      // Title must actually match what we searched for
      if (!titlesMatch(title, returnedTitle)) continue;

      // If we have a year hint (from review date), check the release year
      // Allow a 2-year window since reviews can come out before/after release
      if (releaseYearHint && show?.releaseYear) {
        const diff = Math.abs(show.releaseYear - releaseYearHint);
        if (diff > 2) continue;
      }

      // Good match — extract platforms
      const options = show?.streamingOptions?.gb;
      if (!options || !Array.isArray(options)) continue;

      const platforms: string[] = [];
      for (const option of options) {
        const type = option?.type;
        if (type === "rent" || type === "buy" || type === "addon") continue;
        const serviceId = option?.service?.id;
        if (serviceId && SERVICE_IDS.includes(serviceId)) {
          if (!platforms.includes(serviceId)) {
            platforms.push(serviceId);
          }
        }
      }

      if (platforms.length > 0) return platforms;
    }

    return [];
  } catch (err) {
    console.error(`Error looking up streaming for "${title}":`, err);
    return [];
  }
}

export async function batchLookupStreaming(
  items: { title: string; releaseYearHint?: number }[],
  maxRequests: number = 90
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();
  const limit = Math.min(items.length, maxRequests);

  for (let i = 0; i < limit; i++) {
    const { title, releaseYearHint } = items[i];
    const platforms = await lookupStreaming(title, releaseYearHint);
    results.set(title, platforms);
    if (i < limit - 1) {
      await delay(300);
    }
  }

  return results;
}

export async function streamingLookupWithProgress(
  items: { title: string; releaseYearHint?: number }[],
  onProgress: (checked: number, total: number, title: string, platforms: string[]) => void,
  signal: AbortSignal
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();
  const total = items.length;

  for (let i = 0; i < total; i++) {
    if (signal.aborted) break;

    const { title, releaseYearHint } = items[i];
    const platforms = await lookupStreaming(title, releaseYearHint);
    results.set(title, platforms);
    onProgress(i + 1, total, title, platforms);

    if (i < total - 1 && !signal.aborted) {
      await delay(300);
    }
  }

  return results;
}
