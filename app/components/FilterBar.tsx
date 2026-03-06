"use client";

import { PLATFORMS, Review } from "@/lib/types";

export type SortOption = "date" | "rating" | "alpha";
export type StarFilter = "all" | "4" | "5";

interface FilterBarProps {
  reviews: Review[];
  activePlatform: string | null;
  onPlatformChange: (platform: string | null) => void;
  starFilter: StarFilter;
  onStarFilterChange: (filter: StarFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function FilterBar({
  reviews,
  activePlatform,
  onPlatformChange,
  starFilter,
  onStarFilterChange,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  const platformCounts = new Map<string, number>();
  let cinemaCount = 0;

  for (const r of reviews) {
    if (r.platforms.length === 0) {
      cinemaCount++;
    }
    for (const p of r.platforms) {
      platformCounts.set(p, (platformCounts.get(p) || 0) + 1);
    }
  }

  return (
    <div className="space-y-4">
      {/* Platform filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onPlatformChange(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activePlatform === null
              ? "bg-[#D4A843] text-[#0D0B09]"
              : "bg-[#1A1714] text-[#A09889] hover:bg-[#2A2520]"
          }`}
        >
          All
        </button>
        {PLATFORMS.map((p) => {
          const count = platformCounts.get(p.id) || 0;
          return (
            <button
              key={p.id}
              onClick={() =>
                onPlatformChange(activePlatform === p.id ? null : p.id)
              }
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activePlatform === p.id
                  ? "text-white"
                  : "bg-[#1A1714] text-[#A09889] hover:bg-[#2A2520]"
              }`}
              style={
                activePlatform === p.id
                  ? { backgroundColor: p.color }
                  : undefined
              }
            >
              {p.label}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          );
        })}
        <button
          onClick={() =>
            onPlatformChange(activePlatform === "cinema" ? null : "cinema")
          }
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activePlatform === "cinema"
              ? "bg-[#4A4540] text-white"
              : "bg-[#1A1714] text-[#A09889] hover:bg-[#2A2520]"
          }`}
        >
          Cinema / Other
          <span className="ml-1.5 opacity-60">{cinemaCount}</span>
        </button>
      </div>

      {/* Star and sort filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6A6259] uppercase tracking-wider">
            Rating
          </span>
          {(["all", "5", "4"] as StarFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => onStarFilterChange(f)}
              className={`px-2.5 py-1 rounded text-sm transition-colors ${
                starFilter === f
                  ? "bg-[#D4A843] text-[#0D0B09] font-medium"
                  : "bg-[#1A1714] text-[#A09889] hover:bg-[#2A2520]"
              }`}
            >
              {f === "all" ? "All" : `${f}★`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6A6259] uppercase tracking-wider">
            Sort
          </span>
          {(
            [
              ["date", "Date"],
              ["rating", "Rating"],
              ["alpha", "A-Z"],
            ] as [SortOption, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => onSortChange(value)}
              className={`px-2.5 py-1 rounded text-sm transition-colors ${
                sortBy === value
                  ? "bg-[#D4A843] text-[#0D0B09] font-medium"
                  : "bg-[#1A1714] text-[#A09889] hover:bg-[#2A2520]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
