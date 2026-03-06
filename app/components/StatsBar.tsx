"use client";

import { Review } from "@/lib/types";

export default function StatsBar({ reviews }: { reviews: Review[] }) {
  const total = reviews.length;
  const fiveStar = reviews.filter((r) => r.stars === 5).length;
  const fourStar = reviews.filter((r) => r.stars === 4).length;

  return (
    <div className="flex flex-wrap gap-6 text-sm">
      <div>
        <span className="text-[#6A6259] uppercase tracking-wider text-xs">
          Reviews
        </span>
        <p className="text-[#E8E0D4] text-2xl font-heading font-bold">{total}</p>
      </div>
      <div>
        <span className="text-[#6A6259] uppercase tracking-wider text-xs">
          5★
        </span>
        <p className="text-[#D4A843] text-2xl font-heading font-bold">
          {fiveStar}
        </p>
      </div>
      <div>
        <span className="text-[#6A6259] uppercase tracking-wider text-xs">
          4★
        </span>
        <p className="text-[#E8E0D4] text-2xl font-heading font-bold">
          {fourStar}
        </p>
      </div>
    </div>
  );
}
