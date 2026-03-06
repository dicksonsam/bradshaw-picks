"use client";

import { useState } from "react";

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
}

export default function RefreshButton({ onRefresh }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 bg-[#D4A843] text-[#0D0B09] rounded-lg font-medium text-sm hover:bg-[#E8C86A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {loading ? "Refreshing..." : "Refresh data"}
    </button>
  );
}
