"use client";

import { useState, useEffect, useRef } from "react";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export default function LocationInput({ value, onChange, id }: LocationInputProps) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce: update map 800ms after user stops typing
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (value.trim()) {
      timerRef.current = setTimeout(() => {
        setDebouncedValue(value.trim());
      }, 800);
    } else {
      setDebouncedValue("");
    }
    return () => clearTimeout(timerRef.current);
  }, [value]);

  return (
    <div>
      <label htmlFor={id ?? "task-location"} className="block text-xs text-muted mb-1">
        場所
      </label>
      <div className="relative">
        <input
          id={id ?? "task-location"}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
          placeholder="例: 渋谷駅、会議室A、Zoom"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>

      {/* Google Maps preview */}
      {debouncedValue && (
        <div className="mt-2">
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(debouncedValue)}&output=embed`}
            className="w-full h-36 rounded-lg border border-border"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(debouncedValue)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Google Mapsで開く
          </a>
        </div>
      )}
    </div>
  );
}
