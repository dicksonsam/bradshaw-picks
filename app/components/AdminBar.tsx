"use client";

import { useState, useCallback, useRef } from "react";

interface AdminBarProps {
  pendingCount: number;
  totalCount: number;
  onDataUpdate: () => void;
}

type ActionState = {
  active: boolean;
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

export default function AdminBar({ pendingCount, totalCount, onDataUpdate }: AdminBarProps) {
  const [state, setState] = useState<ActionState>({ active: false, progress: "" });
  const eventSourceRef = useRef<EventSource | null>(null);

  const runSSEAction = useCallback(
    (url: string) => {
      if (state.active) return;

      setState({ active: true, progress: "Starting..." });

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setState({ active: data.type !== "complete" && data.type !== "error", progress: data.message });
          if (data.type === "complete" || data.type === "error") {
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
        setState({ active: false, progress: "Connection lost." });
        onDataUpdate();
      };
    },
    [state.active, onDataUpdate]
  );

  const handleCancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState({ active: false, progress: "Cancelled. Progress saved." });
    onDataUpdate();
  }, [onDataUpdate]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => runSSEAction("/api/admin/check-reviews")}
          disabled={state.active}
          className="px-3 py-1.5 bg-[#D4A843] text-[#0D0B09] rounded-lg font-medium text-sm hover:bg-[#E8C86A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {state.active && <Spinner />}
          Check for new reviews
        </button>

        <button
          onClick={() => runSSEAction("/api/admin/update-streaming?mode=pending")}
          disabled={state.active || pendingCount === 0}
          className="px-3 py-1.5 bg-[#2A2520] text-[#E8E0D4] rounded-lg font-medium text-sm hover:bg-[#3A3530] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-[#3A3530]"
        >
          Update new ({pendingCount} pending)
        </button>

        <button
          onClick={() => runSSEAction("/api/admin/update-streaming?mode=all")}
          disabled={state.active || totalCount === 0}
          className="px-3 py-1.5 bg-[#2A2520] text-[#E8E0D4] rounded-lg font-medium text-sm hover:bg-[#3A3530] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-[#3A3530]"
        >
          Refresh all streaming
        </button>

        {state.active && (
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 bg-red-900/50 text-red-300 rounded-lg font-medium text-sm hover:bg-red-900/70 transition-colors border border-red-800"
          >
            Cancel
          </button>
        )}
      </div>

      {state.progress && (
        <p className={`text-xs ${state.active ? "text-[#D4A843]" : "text-[#8A8279]"}`}>
          {state.progress}
        </p>
      )}
    </div>
  );
}
