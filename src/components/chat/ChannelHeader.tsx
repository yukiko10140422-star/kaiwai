"use client";

import Link from "next/link";
import type { Channel, Profile } from "@/types/database";
import { Avatar } from "@/components/ui";

interface ChannelHeaderProps {
  channel: Channel;
  members: Profile[];
  onMembersClick?: () => void;
  onFilesClick?: () => void;
  onPinsClick?: () => void;
  showPins?: boolean;
  projectId?: string | null;
}

export default function ChannelHeader({
  channel,
  members,
  onMembersClick,
  onFilesClick,
  onPinsClick,
  showPins,
  projectId,
}: ChannelHeaderProps) {
  const isProject = !!projectId;

  return (
    <div className="flex items-center justify-between border-b border-border px-3 sm:px-6 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {isProject ? (
            <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 7.5A2.5 2.5 0 014.5 5h4.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19.5A2.5 2.5 0 0122 9.5v8a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 17.5v-10z" />
            </svg>
          ) : (
            <span className="text-muted text-sm">#</span>
          )}
          <h2 className="text-base sm:text-lg font-bold truncate">{channel.name}</h2>
          {isProject && (
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="text-xs text-accent hover:underline shrink-0 hidden sm:inline-flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-4.5h6m0 0v6m0-6L10.5 13.5" />
              </svg>
              詳細
            </Link>
          )}
        </div>
        {channel.description && (
          <p className="text-xs text-muted truncate hidden sm:block">{channel.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Project links (mobile) */}
        {isProject && (
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="sm:hidden rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-card transition-colors"
            title="プロジェクト詳細"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-4.5h6m0 0v6m0-6L10.5 13.5" />
            </svg>
          </Link>
        )}

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
