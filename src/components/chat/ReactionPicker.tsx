"use client";

import { motion } from "framer-motion";
import { QUICK_EMOJIS } from "@/lib/reactions";

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <motion.div
        className="absolute bottom-full mb-1 right-0 z-50 glass rounded-xl px-2 py-1.5 flex gap-0.5 shadow-lg"
        initial={{ opacity: 0, scale: 0.9, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 4 }}
        transition={{ duration: 0.1 }}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border/40 transition-colors text-lg"
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    </>
  );
}
