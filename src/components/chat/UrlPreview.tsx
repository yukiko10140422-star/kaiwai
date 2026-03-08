"use client";

import { extractUrls, type UrlEmbed } from "@/lib/url-preview";

interface UrlPreviewProps {
  content: string;
}

export default function UrlPreview({ content }: UrlPreviewProps) {
  const embeds = extractUrls(content);
  if (embeds.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {embeds.map((embed, i) => {
        if (embed.type === 'youtube' && embed.embedUrl) {
          return (
            <div key={i} className="rounded-lg overflow-hidden border border-border max-w-sm">
              <iframe
                src={embed.embedUrl}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          );
        }

        // For regular links, show a simple styled link card
        if (embed.type === 'link') {
          return (
            <a
              key={i}
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-card/80 text-sm max-w-sm truncate"
            >
              <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="truncate text-accent">{embed.url}</span>
            </a>
          );
        }
        return null;
      })}
    </div>
  );
}
