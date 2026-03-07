"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed bottom-6 right-6 z-50 glass rounded-xl px-5 py-3 border-l-4 ${typeStyles[type]} shadow-lg max-w-sm`}
          initial={{ opacity: 0, y: 20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 20 }}
          transition={{ duration: 0.2 }}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
