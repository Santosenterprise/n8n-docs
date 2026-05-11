"use client";

import type { ChatMessage, ConfidenceFlag, AssumedFlag } from "@/lib/types";

function ConfidenceBadge({ flag }: { flag: ConfidenceFlag }) {
  const pct = Math.round(flag.score * 100);
  const color =
    pct >= 80 ? "text-emerald-400 bg-emerald-950 border-emerald-800" :
    pct >= 50 ? "text-amber-400 bg-amber-950 border-amber-800" :
    "text-red-400 bg-red-950 border-red-800";

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs ${color}`} title={flag.note}>
      <span className="font-medium">{flag.aspect}</span>
      <span className="font-bold">{pct}%</span>
    </div>
  );
}

function AssumptionBadge({ flag }: { flag: AssumedFlag }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs bg-purple-950 border-purple-700 text-purple-300"
      title={`Confidence: ${Math.round(flag.confidence * 100)}%`}
    >
      <span className="text-purple-400">~</span>
      <span>{flag.assumption}</span>
    </div>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-slate-700 px-1 rounded text-sm">$1</code>')
    .replace(/\n/g, "<br/>");
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const parsed = message.parsed;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        {!isUser && parsed && (
          <div className="flex items-center gap-2 px-1">
            <PhaseTag phase={parsed.phase} />
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700"
          }`}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <p
              dangerouslySetInnerHTML={{
                __html: parsed?.message
                  ? renderMarkdown(parsed.message)
                  : renderMarkdown(message.content),
              }}
            />
          )}
        </div>

        {!isUser && parsed && (
          <>
            {parsed.confidence_flags && parsed.confidence_flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1">
                {parsed.confidence_flags.map((f, i) => (
                  <ConfidenceBadge key={i} flag={f} />
                ))}
              </div>
            )}

            {parsed.assumed_flags && parsed.assumed_flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1">
                {parsed.assumed_flags.map((f, i) => (
                  <AssumptionBadge key={i} flag={f} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PhaseTag({ phase }: { phase: number }) {
  const labels: Record<number, { label: string; color: string }> = {
    1: { label: "Brainstorm", color: "text-indigo-400 bg-indigo-950 border-indigo-800" },
    2: { label: "Gap Audit", color: "text-amber-400 bg-amber-950 border-amber-800" },
    3: { label: "Final Output", color: "text-emerald-400 bg-emerald-950 border-emerald-800" },
  };
  const meta = labels[phase] ?? labels[1];
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${meta.color}`}>
      {meta.label}
    </span>
  );
}
