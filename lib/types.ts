export interface Review {
  title: string;
  year: string;
  stars: number;
  platforms: string[];
  snippet: string;
  guardianUrl: string;
  reviewDate: string;
  genre: string;
  thumbnail: string;
}

export interface CacheData {
  lastUpdated: string;
  reviews: Review[];
}

export interface SSEProgressEvent {
  type: "progress" | "complete" | "error";
  checked?: number;
  total?: number;
  message: string;
}

export interface GuardianResult {
  webTitle: string;
  fields: {
    starRating?: string;
    headline?: string;
    trailText?: string;
    shortUrl?: string;
    byline?: string;
    thumbnail?: string;
  };
  webPublicationDate: string;
  webUrl: string;
}

export interface GuardianResponse {
  response: {
    status: string;
    total: number;
    pages: number;
    currentPage: number;
    results: GuardianResult[];
  };
}

export const PLATFORMS = [
  { id: "netflix", label: "Netflix", color: "#E50914" },
  { id: "prime", label: "Prime Video", color: "#00A8E1" },
  { id: "now", label: "Sky/Now TV", color: "#0072C9" },
  { id: "disney", label: "Disney+", color: "#113CCF" },
  { id: "apple", label: "Apple TV+", color: "#000000" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];

export const PLATFORM_MAP: Record<string, string> = {
  netflix: "Netflix",
  prime: "Prime Video",
  now: "Sky/Now TV",
  disney: "Disney+",
  apple: "Apple TV+",
};
