export interface UrlEmbed {
  type: 'youtube' | 'link';
  url: string;
  embedUrl?: string; // for iframe embeds
}

// Extract URLs from message text
export function extractUrls(text: string): UrlEmbed[] {
  const urlRegex = /https?:\/\/[^\s<>]+/g;
  const matches = text.match(urlRegex);
  if (!matches) return [];

  return matches.map(url => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (ytMatch) {
      return {
        type: 'youtube' as const,
        url,
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      };
    }

    return { type: 'link' as const, url };
  });
}
