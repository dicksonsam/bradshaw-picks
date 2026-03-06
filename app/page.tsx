"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CacheData } from "@/lib/types";
import ReviewCard from "./components/ReviewCard";
import FilterBar, { SortOption, StarFilter } from "./components/FilterBar";
import StatsBar from "./components/StatsBar";
import AdminBar from "./components/AdminBar";

function SkeletonCard() {
  return (
    <div className="bg-[#1A1714] rounded-lg border border-[#2A2520] overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-[#2A2520]" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-[#2A2520] rounded w-3/4" />
        <div className="h-3 bg-[#2A2520] rounded w-full" />
        <div className="h-3 bg-[#2A2520] rounded w-2/3" />
        <div className="flex gap-2">
          <div className="h-5 bg-[#2A2520] rounded w-16" />
          <div className="h-5 bg-[#2A2520] rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<CacheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [starFilter, setStarFilter] = useState<StarFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingCount = useMemo(
    () => data?.reviews.filter((r) => r.platforms.length === 0).length ?? 0,
    [data]
  );

  const filteredReviews = useMemo(() => {
    if (!data) return [];

    let reviews = [...data.reviews];

    // Platform filter
    if (activePlatform === "cinema") {
      reviews = reviews.filter((r) => r.platforms.length === 0);
    } else if (activePlatform) {
      reviews = reviews.filter((r) => r.platforms.includes(activePlatform));
    }

    // Star filter
    if (starFilter !== "all") {
      const stars = parseInt(starFilter);
      reviews = reviews.filter((r) => r.stars === stars);
    }

    // Sort
    switch (sortBy) {
      case "date":
        reviews.sort(
          (a, b) =>
            new Date(b.reviewDate).getTime() -
            new Date(a.reviewDate).getTime()
        );
        break;
      case "rating":
        reviews.sort((a, b) => b.stars - a.stars);
        break;
      case "alpha":
        reviews.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return reviews;
  }, [data, activePlatform, starFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#0D0B09]">
      {/* Header */}
      <header className="border-b border-[#2A2520] px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#E8E0D4]">
            Bradshaw<span className="text-[#D4A843]">Picks</span>
          </h1>
          <p className="mt-2 text-[#8A8279] text-sm md:text-base max-w-xl">
            Peter Bradshaw&apos;s top-rated Guardian film reviews, matched to
            your UK streaming platforms.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats and admin */}
        {data && (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <StatsBar reviews={data.reviews} />
            <AdminBar
              pendingCount={pendingCount}
              totalCount={data.reviews.length}
              onDataUpdate={fetchData}
            />
          </div>
        )}

        {/* Filters */}
        {data && (
          <FilterBar
            reviews={data.reviews}
            activePlatform={activePlatform}
            onPlatformChange={setActivePlatform}
            starFilter={starFilter}
            onStarFilterChange={setStarFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && data && (
          <>
            <p className="text-[#6A6259] text-sm">
              Showing {filteredReviews.length} of {data.reviews.length} reviews
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReviews.map((review, i) => (
                <ReviewCard key={`${review.title}-${i}`} review={review} />
              ))}
            </div>
            {filteredReviews.length === 0 && (
              <p className="text-center text-[#6A6259] py-12">
                No reviews match your filters.
              </p>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2520] px-6 py-6 text-center text-[#6A6259] text-xs">
        {data && (
          <p>
            Last updated:{" "}
            {new Date(data.lastUpdated).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        <p className="mt-1">
          Data from{" "}
          <a
            href="https://www.theguardian.com"
            className="text-[#D4A843] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Guardian
          </a>{" "}
          &amp;{" "}
          <a
            href="https://www.movieofthenight.com"
            className="text-[#D4A843] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Streaming Availability
          </a>
        </p>
      </footer>
    </div>
  );
}
