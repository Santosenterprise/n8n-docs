"use client";

import type { Phase } from "@/lib/types";

const PHASES = [
  { id: 1, label: "Brainstorm", desc: "Capture the idea" },
  { id: 2, label: "Gap Audit", desc: "Resolve unknowns" },
  { id: 3, label: "Final Output", desc: "Generate package" },
] as const;

const COLORS: Record<Phase, { active: string; dot: string; line: string }> = {
  1: { active: "text-indigo-400 border-indigo-400", dot: "bg-indigo-400", line: "bg-slate-700" },
  2: { active: "text-amber-400 border-amber-400", dot: "bg-amber-400", line: "bg-slate-700" },
  3: { active: "text-emerald-400 border-emerald-400", dot: "bg-emerald-400", line: "bg-slate-700" },
};

export default function PhaseIndicator({ phase }: { phase: Phase }) {
  return (
    <div className="flex items-center gap-0 px-4 py-3 bg-slate-900 border-b border-slate-800">
      {PHASES.map((p, i) => {
        const isDone = p.id < phase;
        const isActive = p.id === phase;
        const colors = COLORS[phase];

        return (
          <div key={p.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${isDone ? "bg-slate-600 border-slate-600 text-slate-400" : ""}
                  ${isActive ? `${colors.dot} border-transparent text-slate-900` : ""}
                  ${!isDone && !isActive ? "bg-slate-800 border-slate-700 text-slate-500" : ""}
                `}
              >
                {isDone ? "✓" : p.id}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium whitespace-nowrap
                  ${isActive ? colors.active.split(" ")[0] : "text-slate-500"}
                `}
              >
                {p.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mb-4 mx-1 ${p.id < phase ? "bg-slate-600" : "bg-slate-800"}`}
              />
            )}
          </div>
        );
      })}
      <div className="ml-auto text-xs text-slate-500">
        Phase {phase} of 3
      </div>
    </div>
  );
}
