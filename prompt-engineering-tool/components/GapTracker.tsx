"use client";

import type { Gap } from "@/lib/types";

interface GapTrackerProps {
  gaps: Gap[];
  onToggle: (id: number) => void;
}

export default function GapTracker({ gaps, onToggle }: GapTrackerProps) {
  if (gaps.length === 0) {
    return (
      <div className="p-4 text-slate-500 text-sm text-center">
        <p className="text-2xl mb-2">🔍</p>
        <p>Gaps will appear here during Phase 2</p>
      </div>
    );
  }

  const resolvedCount = gaps.filter((g) => g.resolved).length;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gap Tracker</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          resolvedCount === gaps.length
            ? "bg-emerald-900 text-emerald-300"
            : "bg-amber-900 text-amber-300"
        }`}>
          {resolvedCount}/{gaps.length}
        </span>
      </div>

      <div className="space-y-2">
        {gaps.map((gap) => (
          <div
            key={gap.id}
            onClick={() => onToggle(gap.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-all text-sm ${
              gap.resolved
                ? "bg-emerald-950 border-emerald-800 opacity-70"
                : "bg-slate-800 border-slate-700 hover:border-amber-600"
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                  gap.resolved
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-500"
                }`}
              >
                {gap.resolved && "✓"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`leading-snug ${gap.resolved ? "line-through text-slate-500" : "text-slate-200"}`}>
                  {gap.description}
                </p>
                {gap.resolved && gap.resolution && (
                  <p className="mt-1 text-xs text-emerald-400 truncate">↳ {gap.resolution}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {resolvedCount === gaps.length && gaps.length > 0 && (
        <p className="mt-3 text-xs text-emerald-400 text-center">
          All gaps resolved — ready to advance
        </p>
      )}
    </div>
  );
}
