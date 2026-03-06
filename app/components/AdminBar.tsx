"use client";

import { useState, useCallback, useRef } from "react";

interface AdminBarProps {
  pendingCount: number;
  skyPendingCount: number;
  totalCount: number;
  onDataUpdate: () => void;
}

type ActionState = {
  activeUrl: string | null;
  progress: string;
};

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
  );
}

export default function AdminBar({ pendingCount, skyPendingCount, totalCount, onDataUpdate }: AdminBarProps) {
  const [state, setState] = useState<ActionState>({ activeUrl: null, progress: "" });
  const eventSourceRef = useRef<EventSource | null>(null);

  const runSSEAction = useCallback(
    (url: string) => {
      if (state.activeUrl) return;

      setState({ activeUrl: url, progress: "Starting..." });

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const done = data.type === "complete" || data.type === "error";
          setState({ activeUrl: done ? null : url, progress: data.message });
          if (done) {
            es.close();
            eventSourceRef.current = null;
            onDataUpdate();
          }
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        setState({ activeUrl: null, progress: "Connection lost." });
        onDataUpdate();
      };
    },
    [state.activeUrl, onDataUpdate]
  );

  const handleCancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState({ activeUrl: null, progress: "Cancelled. Progress saved." });
    onDataUpdate();
  }, [onDataUpdate]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => runSSEAction("/api/admin/check-reviews")}
          disabled={!!state.activeUrl}
          className="px-3 py-1.5 bg-[#D4A843] text-[#0D0B09] rounded-lg font-medium text-sm hover:bg-[#E8C86A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {state.activeUrl === "/api/admin/check-reviews" && <Spinner />}
          Check for new reviews
        </button>

        <button
          onClick={() => runSSEAction("/api/admin/update-streaming?mode=pending")}
          disabled={!!state.activeUrl || pendingCount === 0}
          className="px-3 py-1.5 bg-[#2A2520] text-[#E8E0D4] rounded-lg font-medium text-sm hover:bg-[#3A3530] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-[#3A3530]"
        >
          {state.activeUrl === "/api/admin/update-streaming?mode=pending" && <Spinner />}
          Update new ({pendingCount} pending)
        </button>

        <button
          onClick={() => runSSEAction("/api/admin/update-streaming?mode=all")}
          disabled={!!state.activeUrl || totalCount === 0}
          className="px-3 py-1.5 bg-[#2A2520] text-[#E8E0D4] rounded-lg font-medium text-sm hover:bg-[#3A3530] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-[#3A3530]"
        >
          {state.activeUrl === "/api/admin/update-streaming?mode=all" && <Spinner />}
          Refresh all streaming
        </button>

        <button
          onClick={() => runSSEAction("/api/admin/update-sky?mode=pending")}
          disabled={!!state.activeUrl || skyPendingCount === 0}
          className="px-3 py-1.5 bg-[#0072C9]/20 text-[#4DA3E0] rounded-lg font-medium text-sm hover:bg-[#0072C9]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-[#0072C9]/40"
        >
          {state.activeUrl === "/api/admin/update-sky?mode=pending" && <Spinner />}
          Update Sky/Now ({skyPendingCount} pending)
        </button>

        {state.activeUrl && (
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 bg-red-900/50 text-red-300 rounded-lg font-medium text-sm hover:bg-red-900/70 transition-colors border border-red-800"
          >
            Cancel
          </button>
        )}
      </div>

      {state.progress && (
        <p className={`text-xs ${state.activeUrl ? "text-[#D4A843]" : "text-[#8A8279]"}`}>
          {state.progress}
        </p>
      )}
    </div>
  );
}
