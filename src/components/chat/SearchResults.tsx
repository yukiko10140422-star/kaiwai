"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui";
import type { SearchResult } from "@/lib/search";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
}

export default function SearchResults({ results, query, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted text-sm">
        検索中…
      </div>
    );
  }

  if (query && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted text-sm">
        <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        「{query}」に一致するメッセージが見つかりませんでした
      </div>
    );
  }

  if (!query) return null;

  return (
    <div className="divide-y divide-border">
      <p className="px-4 py-2 text-xs text-muted">
        {results.length}件の結果
      </p>
      {results.map((result) => (
        <div key={result.id}>
          <Link
            href={`/dashboard/chat/${result.channel_id}`}
            className="flex gap-3 px-4 py-3 hover:bg-card/60 transition-colors"
          >
            <Avatar
              name={result.author_name}
              src={result.author_avatar_url}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted mb-0.5">
                <span className="font-medium text-foreground">
                  {result.author_name}
                </span>
                <span className="opacity-60">#</span>
                <span>{result.channel_name}</span>
                <span className="ml-auto">
                  {new Date(result.created_at).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground truncate">
                <HighlightText text={result.content} query={query} />
              </p>
            </div>
          </Link>
        </div>
      ))}
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
          <mark key={i} className="bg-accent/30 text-foreground rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
