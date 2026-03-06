"use client";

import { Review, PLATFORMS } from "@/lib/types";

function StarRating({ count }: { count: number }) {
  return (
    <span className="text-[#D4A843] text-lg tracking-wide">
      {"★".repeat(count)}
    </span>
  );
}

function PlatformBadge({ platformId }: { platformId: string }) {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  if (!platform) return null;

  const isApple = platformId === "apple";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
      style={{
        backgroundColor: platform.color,
        border: isApple ? "1px solid #444" : "none",
      }}
    >
      {platform.label}
    </span>
  );
}

export default function ReviewCard({ review }: { review: Review }) {
  const hasPlatforms = review.platforms.length > 0;

  return (
    <article className="bg-[#1A1714] rounded-lg overflow-hidden border border-[#2A2520] hover:border-[#D4A843]/40 transition-colors">
      {review.thumbnail && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={review.thumbnail}
            alt={review.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-heading text-lg font-bold text-[#E8E0D4] leading-tight">
            {review.title}
            {review.year && (
              <span className="text-[#8A8279] font-normal text-sm ml-2">
                ({review.year})
              </span>
            )}
          </h3>
          <StarRating count={review.stars} />
        </div>

        {review.snippet && (
          <p className="text-[#A09889] text-sm leading-relaxed mb-3 line-clamp-3">
            {review.snippet}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {hasPlatforms ? (
            review.platforms.map((p) => (
              <PlatformBadge key={p} platformId={p} />
            ))
          ) : (
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-medium text-[#A09889]"
              style={{ backgroundColor: "#4A4540" }}
            >
              Cinema / Other
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-[#6A6259]">
          <time>
            {new Date(review.reviewDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
          <a
            href={review.guardianUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4A843] hover:text-[#E8C86A] transition-colors"
          >
            Read review &rarr;
          </a>
        </div>
      </div>
    </article>
  );
}
