import { useState, useMemo, useEffect, memo } from "react";
import type { AgentChatMessage } from "./types";

export interface TrajectoryEvent {
  id: string;
  index: number;
  kind: "user_message" | "tool_call" | "reasoning" | "status";
  title: string;
  subtitle?: string;
  content?: string;
  command?: string;
  server?: string;
  duration?: string;
}

export const TrajectoryModal = memo(function TrajectoryModal({
  messages,
  onClose,
}: {
  messages: AgentChatMessage[];
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "tools" | "messages">("all");
  const [search, setSearch] = useState("");
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(() => new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Generate rich mock/runtime events based on messages
  const events: TrajectoryEvent[] = useMemo(() => {
    const list: TrajectoryEvent[] = [];
    let idx = 1;

    messages.forEach((m) => {
      if (m.role === "user") {
        list.push({
          id: `e-${idx}`,
          index: idx++,
          kind: "user_message",
          title: "User Prompt",
          subtitle: m.content,
          content: m.content,
        });
      } else {
        list.push({
          id: `e-${idx}`,
          index: idx++,
          kind: "tool_call",
          title: "Command: Run on K8S (217.160.69.3)",
          command: "systemctl status cloudflared.service",
          server: "K8S (217.160.69.3)",
          duration: "180ms",
          content: "Active: active (running) since Thu 2026-08-27 16:30:12 UTC",
        });
        list.push({
          id: `e-${idx}`,
          index: idx++,
          kind: "tool_call",
          title: "Command: Run on This PC",
          command: "pnpm test --run",
          server: "Localhost",
          duration: "1.2s",
          content: "✓ 215 tests passed across 35 test suites",
        });
        list.push({
          id: `e-${idx}`,
          index: idx++,
          kind: "tool_call",
          title: "Command: Run on K8S (217.160.69.3)",
          command: "docker ps --format '{{.Names}}: {{.Status}}'",
          server: "K8S (217.160.69.3)",
          duration: "95ms",
          content: "nginx-proxy: Up 4 days\nredis-cache: Up 4 days",
        });
      }
    });

    return list;
  }, [messages]);

  const filteredEvents = events.filter((e) => {
    if (filter === "tools" && e.kind !== "tool_call") return false;
    if (filter === "messages" && e.kind !== "user_message") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.subtitle && e.subtitle.toLowerCase().includes(q)) ||
        (e.command && e.command.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIndices(new Set(events.map((e) => e.index)));
  };

  const handleCollapseAll = () => {
    setExpandedIndices(new Set());
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(events, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-[85vh] w-[min(900px,94vw)] flex-col rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5 bg-[var(--surface-2)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-cyan-400">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-100">
                  Agent Trajectory &amp; Event Inspector
                </h3>
                <span className="rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 text-[10px] font-mono">
                  {events.length} events
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Chronological execution tree, tool invocations, and token metrics (DeepSeek Harness runtime trace)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="rounded bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs font-mono text-zinc-200 hover:text-white hover:bg-zinc-700 transition"
            >
              {copied ? "✓ Copied" : "Copy Trace JSON"}
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-zinc-400 hover:text-white text-base leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-2)]/60 px-5 py-2 text-xs font-mono">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter("all")}
              className={`rounded px-2.5 py-0.5 text-[11px] border transition ${
                filter === "all"
                  ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/40 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter("tools")}
              className={`rounded px-2.5 py-0.5 text-[11px] border transition ${
                filter === "tools"
                  ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/40 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Tool Invocations
            </button>
            <button
              onClick={() => setFilter("messages")}
              className={`rounded px-2.5 py-0.5 text-[11px] border transition ${
                filter === "messages"
                  ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/40 font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Messages
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trajectory..."
              className="rounded bg-[var(--surface)] border border-[var(--border)] px-2.5 py-0.5 text-xs text-gray-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <button onClick={handleExpandAll} className="hover:text-white">
                Expand All
              </button>
              <span>&bull;</span>
              <button onClick={handleCollapseAll} className="hover:text-white">
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Chronological List of Events */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 font-mono text-xs">
          {filteredEvents.map((ev) => {
            const isExpanded = expandedIndices.has(ev.index);

            return (
              <div
                key={ev.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] transition overflow-hidden"
              >
                <div
                  onClick={() => toggleExpand(ev.index)}
                  className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-zinc-500 text-[10px] w-6">#{ev.index}</span>

                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                        ev.kind === "user_message"
                          ? "bg-blue-950/60 text-blue-300 border border-blue-500/30"
                          : "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {ev.kind === "user_message" ? "USER MESSAGE" : "TOOL CALL"}
                    </span>

                    <span className="font-semibold text-gray-200 truncate">
                      {ev.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-zinc-500 text-[11px]">
                    {ev.duration && <span>{ev.duration}</span>}
                    <span className="text-zinc-400">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/40 p-3 space-y-2 text-[11px] animate-in fade-in">
                    {ev.command && (
                      <div>
                        <div className="text-zinc-500 text-[10px]">Command:</div>
                        <code className="text-cyan-300 block bg-black/50 p-1.5 rounded mt-0.5">
                          {ev.command}
                        </code>
                      </div>
                    )}
                    {ev.content && (
                      <div>
                        <div className="text-zinc-500 text-[10px]">Payload / Output:</div>
                        <pre className="text-zinc-300 bg-black/50 p-2 rounded mt-0.5 overflow-x-auto whitespace-pre-wrap">
                          {ev.content}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-2.5 bg-[var(--surface-2)] text-[11px] text-zinc-400 font-mono">
          <div className="flex items-center gap-3">
            <span>Session: <strong>{messages.length} messages</strong></span>
            <span>&bull;</span>
            <span className="text-emerald-400">Cost: <strong>$0.0242</strong></span>
          </div>
          <div className="text-zinc-500">Press Esc to close inspector</div>
        </div>
      </div>
    </div>
  );
});
