import { GuardianResponse, Review } from "./types";

const API_BASE = "https://content.guardianapis.com/search";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function extractTitleAndYear(headline: string): { title: string; year: string } {
  // Bradshaw headlines are typically: "Film Title review – description"
  // or "Film Title review: description"
  let title = headline;

  // Remove "review" and everything after common separators
  title = title.replace(/\s*[-–—:]\s*review.*$/i, "");
  title = title.replace(/\s+review\s*[-–—:].*$/i, "");
  title = title.replace(/\s+review$/i, "");

  // Try to extract year from parentheses
  const yearMatch = title.match(/\((\d{4})\)/);
  const year = yearMatch ? yearMatch[1] : "";
  if (yearMatch) {
    title = title.replace(/\s*\(\d{4}\)/, "").trim();
  }

  return { title: title.trim(), year };
}

export async function fetchBradshawReviews(fromDate?: string): Promise<Review[]> {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) throw new Error("GUARDIAN_API_KEY not set");

  const reviews: Review[] = [];
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;

  // TODO: Remove page cap for production
  while (page <= totalPages && page <= 10) {
    const params = new URLSearchParams({
      tag: "profile/peterbradshaw",
      section: "film",
      "show-fields": "starRating,headline,trailText,shortUrl,byline,thumbnail",
      "page-size": String(pageSize),
      page: String(page),
      "api-key": apiKey,
    });

    if (fromDate) {
      params.set("from-date", fromDate);
    }

    const res = await fetch(`${API_BASE}?${params}`);
    if (!res.ok) {
      throw new Error(`Guardian API error: ${res.status} ${res.statusText}`);
    }

    const data: GuardianResponse = await res.json();
    totalPages = data.response.pages;

    for (const item of data.response.results) {
      const starRating = parseInt(item.fields?.starRating || "0", 10);
      if (starRating < 4) continue;

      const headline = item.fields?.headline || item.webTitle;
      const { title, year } = extractTitleAndYear(headline);
      const snippet = item.fields?.trailText
        ? stripHtml(item.fields.trailText)
        : "";

      reviews.push({
        title,
        year,
        stars: starRating,
        platforms: [],
        snippet,
        guardianUrl: item.fields?.shortUrl || item.webUrl,
        reviewDate: item.webPublicationDate,
        genre: "",
        thumbnail: item.fields?.thumbnail || "",
      });
    }

    page++;
  }

  return reviews;
}
