"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatMessage, SessionState, Gap, Phase } from "@/lib/types";
import { parseAIResponse } from "@/lib/parser";
import MessageBubble from "./MessageBubble";
import PhaseIndicator from "./PhaseIndicator";
import GapTracker from "./GapTracker";
import ExportButton from "./ExportButton";

const SESSION_KEY = "prompt_tool_session_v1";

function makeId() {
  return Math.random().toString(36).slice(2);
}

function initialState(): SessionState {
  return {
    messages: [],
    phase: 1,
    gaps: [],
    phaseApproved: false,
    exportApproved: false,
    promptPackage: null,
  };
}

function loadSession(): SessionState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return initialState();
}

function saveSession(state: SessionState) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export default function ChatInterface() {
  const [session, setSession] = useState<SessionState>(initialState);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [phaseReadyTip, setPhaseReadyTip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loaded = loadSession();
    setSession(loaded);
  }, []);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, loading]);

  const lastAIMessage = session.messages.filter((m) => m.role === "assistant").at(-1);
  const phaseComplete = lastAIMessage?.parsed?.phase_complete ?? false;
  const canAdvance =
    (session.phase === 1 && phaseComplete) ||
    (session.phase === 2 &&
      phaseComplete &&
      session.gaps.length > 0 &&
      session.gaps.every((g) => g.resolved)) ||
    (session.phase === 3 && phaseComplete);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setError(null);

      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      const nextMessages = [...session.messages, userMsg];
      setSession((s) => ({ ...s, messages: nextMessages }));
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Request failed");
        }

        const data = await res.json();
        const parsed = parseAIResponse(data.content);

        const aiMsg: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: data.content,
          parsed: parsed ?? undefined,
          timestamp: Date.now(),
        };

        setSession((s) => {
          const updated: SessionState = {
            ...s,
            messages: [...s.messages, aiMsg],
          };

          if (parsed) {
            if (parsed.gaps && parsed.gaps.length > 0) {
              const mergedGaps: Gap[] = parsed.gaps.map((newGap) => {
                const existing = s.gaps.find((g) => g.id === newGap.id);
                return existing?.resolved
                  ? { ...newGap, resolved: true, resolution: existing.resolution }
                  : newGap;
              });
              updated.gaps = mergedGaps;
            }
            if (parsed.prompt_package) {
              updated.promptPackage = parsed.prompt_package;
            }
          }

          return updated;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setSession((s) => ({
          ...s,
          messages: s.messages.filter((m) => m.id !== userMsg.id),
        }));
        setInput(text);
      } finally {
        setLoading(false);
      }
    },
    [session.messages, loading]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function advancePhase() {
    if (!canAdvance) return;
    setSession((s) => ({
      ...s,
      phase: (s.phase < 3 ? s.phase + 1 : s.phase) as Phase,
      phaseApproved: true,
    }));
    setPhaseReadyTip(false);
  }

  function approveExport() {
    setSession((s) => ({ ...s, exportApproved: true }));
  }

  function toggleGap(id: number) {
    setSession((s) => ({
      ...s,
      gaps: s.gaps.map((g) =>
        g.id === id
          ? { ...g, resolved: !g.resolved, resolution: g.resolved ? null : "Manually marked resolved" }
          : g
      ),
    }));
  }

  function resetSession() {
    setSession(initialState());
    localStorage.removeItem(SESSION_KEY);
  }

  function startConversation() {
    send("Hi, I have an idea I'd like to turn into a prompt.");
  }

  const resolvedGaps = session.gaps.filter((g) => g.resolved).length;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      <PhaseIndicator phase={session.phase} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
            <h1 className="text-sm font-semibold text-slate-300">Prompt Engineering Tool</h1>
            <div className="flex items-center gap-2">
              {session.phase === 2 && session.gaps.length > 0 && (
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-800 sm:hidden"
                >
                  Gaps {resolvedGaps}/{session.gaps.length}
                </button>
              )}
              {session.messages.length > 0 && (
                <button
                  onClick={resetSession}
                  className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {session.messages.length === 0 ? (
              <EmptyState onStart={startConversation} loading={loading} />
            ) : (
              <>
                {session.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {loading && <TypingIndicator />}
              </>
            )}
            {error && (
              <div className="mx-auto max-w-sm mt-2 p-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm text-center">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {canAdvance && session.phase < 3 && (
            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800">
              <CheckpointBanner phase={session.phase} onAdvance={advancePhase} />
            </div>
          )}

          {session.phase === 3 && session.promptPackage && !session.exportApproved && (
            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800">
              <ApprovalBanner onApprove={approveExport} />
            </div>
          )}

          {session.phase === 3 && session.promptPackage && session.exportApproved && (
            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800">
              <ExportButton promptPackage={session.promptPackage} />
            </div>
          )}

          <div className="px-4 py-3 bg-slate-900 border-t border-slate-800">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  session.messages.length === 0
                    ? "Describe your idea..."
                    : "Type a message..."
                }
                rows={1}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors max-h-32 overflow-y-auto"
                style={{ minHeight: "44px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 128) + "px";
                }}
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <SendIcon />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
          </div>
        </div>

        {session.phase >= 2 && (
          <div
            className={`
              w-64 flex-shrink-0 border-l border-slate-800 bg-slate-900 overflow-y-auto
              hidden sm:block
            `}
          >
            <GapTracker gaps={session.gaps} onToggle={toggleGap} />
          </div>
        )}

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div
              className="absolute right-0 top-0 bottom-0 w-72 bg-slate-900 border-l border-slate-800 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 border-b border-slate-800 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-300">Gap Tracker</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg">×</button>
              </div>
              <GapTracker gaps={session.gaps} onToggle={toggleGap} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckpointBanner({ phase, onAdvance }: { phase: Phase; onAdvance: () => void }) {
  const labels: Record<number, string> = {
    1: "Primary objective captured — advance to Gap Audit?",
    2: "All gaps resolved — advance to Final Output?",
  };
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-indigo-950 border border-indigo-700">
      <p className="text-sm text-indigo-300 flex-1">{labels[phase]}</p>
      <button
        onClick={onAdvance}
        className="flex-shrink-0 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
      >
        Advance →
      </button>
    </div>
  );
}

function ApprovalBanner({ onApprove }: { onApprove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-950 border border-emerald-700">
      <p className="text-sm text-emerald-300 flex-1">Prompt package ready — approve to enable export?</p>
      <button
        onClick={onApprove}
        className="flex-shrink-0 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
      >
        Approve ✓
      </button>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
      <div className="text-4xl mb-4">⚡</div>
      <h2 className="text-lg font-semibold text-slate-200 mb-2">Prompt Engineering Tool</h2>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        Transform your raw idea into a self-commanding prompt package in 3 phases.
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs text-xs text-slate-600 mb-8">
        {["Phase 1 — Brainstorm your idea", "Phase 2 — Resolve every gap", "Phase 3 — Export your prompt package"].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold flex-shrink-0">{i + 1}</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onStart}
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm disabled:opacity-40 transition-colors"
      >
        Start with an idea
      </button>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
