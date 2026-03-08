"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  searchMessages,
  searchTasks,
  searchChannels,
  type SearchResult,
  type TaskSearchResult,
  type ChannelSearchResult,
} from "@/lib/search";

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

// ────────────────────────────────────────────────────────
// Status / priority label maps
// ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  todo: "Todo",
  in_progress: "進行中",
  review: "レビュー",
  done: "完了",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  review: "bg-amber-500",
  done: "bg-green-500",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-slate-400",
  medium: "text-amber-500",
  high: "text-red-500",
};

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

export default function GlobalSearchDialog({
  open,
  onClose,
}: GlobalSearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [channels, setChannels] = useState<ChannelSearchResult[]>([]);
  const [messages, setMessages] = useState<SearchResult[]>([]);
  const [tasks, setTasks] = useState<TaskSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Focus on open ──────────────────────────────────────
  useEffect(() => {
    if (open) {
      // small delay so the portal has mounted
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      // reset state on close
      setQuery("");
      setChannels([]);
      setMessages([]);
      setTasks([]);
      setHasSearched(false);
      setIsLoading(false);
    }
  }, [open]);

  // ── Debounced search ───────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setChannels([]);
      setMessages([]);
      setTasks([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const [ch, msg, tk] = await Promise.all([
        searchChannels(q, 5),
        searchMessages(q, undefined, 10),
        searchTasks(q, 10),
      ]);
      setChannels(ch);
      setMessages(msg);
      setTasks(tk);
    } catch {
      // silently ignore – search is best-effort
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, runSearch]);

  // ── Keyboard: Escape ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // ── Click outside ─────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  // ── Navigate helpers ──────────────────────────────────
  const goToChannel = (channelId: string) => {
    onClose();
    router.push(`/dashboard/chat/${channelId}`);
  };

  const goToTasks = () => {
    onClose();
    router.push("/dashboard/tasks");
  };

  // ── Helpers ───────────────────────────────────────────
  const totalResults = channels.length + messages.length + tasks.length;
  const noResults = hasSearched && !isLoading && totalResults === 0;

  // ── Render ────────────────────────────────────────────
  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="w-full max-w-2xl rounded-xl border border-border shadow-2xl overflow-hidden glass"
            style={{ backgroundColor: "var(--card)" }}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* ── Search input ──────────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <SearchIcon className="w-5 h-5 text-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="検索..."
                className="flex-1 bg-transparent text-foreground text-base placeholder:text-muted outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border text-[10px] text-muted font-mono">
                ESC
              </kbd>
            </div>

            {/* ── Results body ──────────────────────────── */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-10 text-sm text-muted">
                  <Spinner />
                  <span className="ml-2">検索中...</span>
                </div>
              )}

              {/* No results */}
              {noResults && (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-muted">
                  <SearchIcon className="w-8 h-8 mb-2 opacity-40" />
                  結果がありません
                </div>
              )}

              {/* Results */}
              {!isLoading && hasSearched && totalResults > 0 && (
                <div className="py-2">
                  {/* Channels */}
                  {channels.length > 0 && (
                    <ResultGroup title="チャンネル">
                      {channels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => goToChannel(ch.id)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors"
                        >
                          <span className="w-6 h-6 rounded flex items-center justify-center text-xs bg-accent/20 text-accent shrink-0">
                            #
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">
                              <HighlightText text={ch.name} query={query} />
                            </p>
                            {ch.description && (
                              <p className="text-xs text-muted truncate">
                                {ch.description}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-muted capitalize">
                            {ch.type}
                          </span>
                        </button>
                      ))}
                    </ResultGroup>
                  )}

                  {/* Messages */}
                  {messages.length > 0 && (
                    <ResultGroup title="メッセージ">
                      {messages.map((msg) => (
                        <button
                          key={msg.id}
                          onClick={() => goToChannel(msg.channel_id)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors"
                        >
                          <MessageIcon className="w-5 h-5 text-muted shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-muted mb-0.5">
                              <span className="font-medium text-foreground">
                                {msg.author_name}
                              </span>
                              <span className="opacity-60">#</span>
                              <span>{msg.channel_name}</span>
                            </div>
                            <p className="text-sm text-foreground truncate">
                              <HighlightText
                                text={msg.content}
                                query={query}
                              />
                            </p>
                          </div>
                        </button>
                      ))}
                    </ResultGroup>
                  )}

                  {/* Tasks */}
                  {tasks.length > 0 && (
                    <ResultGroup title="タスク">
                      {tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={goToTasks}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors"
                        >
                          <TaskIcon className="w-5 h-5 text-muted shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">
                              <HighlightText text={task.title} query={query} />
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[task.status] ?? "bg-slate-400"}`}
                              />
                              <span className="text-[11px] text-muted">
                                {STATUS_LABELS[task.status] ?? task.status}
                              </span>
                              <span
                                className={`text-[11px] ${PRIORITY_COLORS[task.priority] ?? "text-muted"}`}
                              >
                                {PRIORITY_LABELS[task.priority] ?? task.priority}
                              </span>
                              {task.assignee_name && (
                                <span className="text-[11px] text-muted ml-auto truncate max-w-[120px]">
                                  {task.assignee_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </ResultGroup>
                  )}
                </div>
              )}

              {/* Empty state – before search */}
              {!hasSearched && !isLoading && (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-muted">
                  <SearchIcon className="w-8 h-8 mb-3 opacity-30" />
                  チャンネル、メッセージ、タスクを横断検索
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <p className="px-4 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
        {title}
      </p>
      {children}
    </div>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-accent/30 text-foreground rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin text-accent"
      fill="none"
      viewBox="0 0 24 24"
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
  );
}

// ── Icons ──────────────────────────────────────────────

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function MessageIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function TaskIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}
