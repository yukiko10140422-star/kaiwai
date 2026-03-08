"use client";

import type { Channel, Profile } from "@/types/database";
import { Avatar } from "@/components/ui";

interface ChannelHeaderProps {
  channel: Channel;
  members: Profile[];
  onMembersClick?: () => void;
  onFilesClick?: () => void;
  onPinsClick?: () => void;
  showPins?: boolean;
}

export default function ChannelHeader({
  channel,
  members,
  onMembersClick,
  onFilesClick,
  onPinsClick,
  showPins,
}: ChannelHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 sm:px-6 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-muted text-sm">#</span>
          <h2 className="text-base sm:text-lg font-bold truncate">{channel.name}</h2>
        </div>
        {channel.description && (
          <p className="text-xs text-muted truncate hidden sm:block">{channel.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Member avatars */}
        <button
          onClick={onMembersClick}
          className="flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-sm text-muted hover:bg-card transition-colors"
        >
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((m) => (
              <Avatar key={m.id} src={m.avatar_url} name={m.display_name} size="sm" />
            ))}
          </div>
          <span className="hidden sm:inline">{members.length}</span>
        </button>

        {/* Pinned messages button */}
        <div className="relative">
          <button
            onClick={onPinsClick}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${showPins ? "text-accent bg-accent/10" : "text-muted hover:bg-card"}`}
            aria-label="Pinned messages"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
          </button>
        </div>

        {/* Files button */}
        <button
          onClick={onFilesClick}
          className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-card transition-colors"
          aria-label="Files"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
