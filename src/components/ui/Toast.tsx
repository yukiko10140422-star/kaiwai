"use client";

import { useEffect } from "react";

type ToastType = "info" | "success" | "error";

interface ToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  type?: ToastType;
  duration?: number;
}

const typeStyles: Record<ToastType, string> = {
  info: "border-accent",
  success: "border-status-done",
  error: "border-status-overdue",
};

export default function Toast({ open, onClose, message, type = "info", duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, onClose, duration]);

  if (!open) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 glass rounded-xl px-5 py-3 border-l-4 ${typeStyles[type]} shadow-lg max-w-sm`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">{message}</p>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground transition-colors text-lg leading-none shrink-0"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
