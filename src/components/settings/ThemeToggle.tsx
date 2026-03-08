"use client";

import { useState, useEffect } from "react";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";
import { Sun, Moon, Monitor } from "lucide-react";

const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "ライト", icon: <Sun className="w-4 h-4" /> },
  { value: "dark", label: "ダーク", icon: <Moon className="w-4 h-4" /> },
  { value: "system", label: "システム", icon: <Monitor className="w-4 h-4" /> },
];

export default function ThemeToggle() {
  const [current, setCurrent] = useState<Theme>("system");

  useEffect(() => {
    setCurrent(getStoredTheme());
  }, []);

  const handleChange = (theme: Theme) => {
    setCurrent(theme);
    setTheme(theme);
  };

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
            current === opt.value
              ? "border-accent bg-accent/10 text-accent"
              : "border-border hover:bg-card text-muted hover:text-foreground"
          }`}
        >
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
