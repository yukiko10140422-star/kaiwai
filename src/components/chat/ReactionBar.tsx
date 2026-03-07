"use client";

import type { GroupedReaction } from "@/lib/reactions";

interface ReactionBarProps {
  reactions: GroupedReaction[];
  onToggle: (emoji: string) => void;
}

export default function ReactionBar({ reactions, onToggle }: ReactionBarProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map(({ emoji, count, reacted }) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
            reacted
              ? "bg-accent/20 border-accent/40 text-accent"
              : "bg-border/10 border-border/30 text-muted hover:bg-border/20"
          }`}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </button>
      ))}
    </div>
  );
}
