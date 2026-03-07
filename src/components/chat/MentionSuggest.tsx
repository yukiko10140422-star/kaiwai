"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui";
import type { Profile } from "@/types/database";

export type MentionMember = Pick<Profile, "id" | "display_name" | "avatar_url">;

interface MentionSuggestProps {
  members: MentionMember[];
  query: string;
  selectedIndex: number;
  onSelect: (member: MentionMember) => void;
  position?: { bottom: number; left: number };
}

export default function MentionSuggest({
  members,
  query,
  selectedIndex,
  onSelect,
  position,
}: MentionSuggestProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = members.filter((m) =>
    m.display_name.toLowerCase().includes(query.toLowerCase())
  );

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (filtered.length === 0) return null;

  return (
    <motion.div
      ref={listRef}
      className="absolute z-50 w-56 max-h-48 overflow-y-auto glass rounded-lg shadow-lg py-1"
      style={position ? { bottom: position.bottom, left: position.left } : { bottom: "100%", left: 0 }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.1 }}
    >
      {filtered.map((member, i) => (
        <button
          key={member.id}
          type="button"
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
            i === selectedIndex ? "bg-accent/10 text-accent" : "hover:bg-card"
          }`}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent textarea blur
            onSelect(member);
          }}
        >
          <Avatar src={member.avatar_url} name={member.display_name} size="xs" />
          <span className="truncate">{member.display_name}</span>
        </button>
      ))}
    </motion.div>
  );
}
