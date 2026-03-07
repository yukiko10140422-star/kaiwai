"use client";

import { useState, useRef, useCallback, type DragEvent, type KeyboardEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MentionSuggest, { type MentionMember } from "./MentionSuggest";

interface FilePreview {
  file: File;
  previewUrl: string | null;
}

interface MessageInputProps {
  onSend: (content: string, files: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  members?: MentionMember[];
}

export default function MessageInput({
  onSend,
  placeholder = "Send a message...",
  disabled = false,
  members = [],
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mention state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const added: FilePreview[] = Array.from(newFiles).map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));
    setFiles((prev) => [...prev, ...added]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const closeMention = useCallback(() => {
    setMentionOpen(false);
    setMentionQuery("");
    setMentionIndex(0);
    setMentionStartPos(null);
  }, []);

  const insertMention = useCallback(
    (member: MentionMember) => {
      if (mentionStartPos === null) return;
      const before = text.slice(0, mentionStartPos);
      const after = text.slice(mentionStartPos + mentionQuery.length + 1); // +1 for @
      const newText = `${before}@${member.display_name} ${after}`;
      setText(newText);
      closeMention();

      // Re-focus and set cursor position
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          const cursorPos = before.length + member.display_name.length + 2; // @ + name + space
          el.setSelectionRange(cursorPos, cursorPos);
        }
      });
    },
    [text, mentionStartPos, mentionQuery, closeMention]
  );

  const getFilteredMembers = useCallback(() => {
    return members.filter((m) =>
      m.display_name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [members, mentionQuery]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Detect @ mention trigger
    const el = textareaRef.current;
    if (!el || members.length === 0) return;

    const cursorPos = el.selectionStart ?? newText.length;
    const textBeforeCursor = newText.slice(0, cursorPos);

    // Find the last @ that could be a mention trigger
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex === -1) {
      if (mentionOpen) closeMention();
      return;
    }

    // @ must be at start or after whitespace
    const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
    if (charBefore !== " " && charBefore !== "\n" && lastAtIndex !== 0) {
      if (mentionOpen) closeMention();
      return;
    }

    const query = textBeforeCursor.slice(lastAtIndex + 1);

    // No newlines in query
    if (query.includes("\n")) {
      if (mentionOpen) closeMention();
      return;
    }

    setMentionOpen(true);
    setMentionQuery(query);
    setMentionStartPos(lastAtIndex);
    setMentionIndex(0);
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;

    onSend(trimmed, files.map((f) => f.file));
    setText("");
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    closeMention();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen) {
      const filtered = getFilteredMembers();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && filtered.length > 0) {
        e.preventDefault();
        insertMention(filtered[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeMention();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div
      className={`relative border-t border-border px-6 py-3 transition-colors ${
        isDragOver ? "bg-accent/10" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File previews */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="flex gap-2 mb-2 flex-wrap"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {files.map((f, i) => (
              <div
                key={`${f.file.name}-${f.file.size}-${i}`}
                className="relative group rounded-lg border border-border overflow-hidden"
              >
                {f.previewUrl ? (
                  <img
                    src={f.previewUrl}
                    alt={f.file.name}
                    className="w-16 h-16 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center bg-card text-[10px] text-muted text-center px-1">
                    {f.file.name.split(".").pop()?.toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-1 -right-1 bg-status-overdue text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                >
                  &times;
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mention suggest dropdown */}
      <AnimatePresence>
        {mentionOpen && members.length > 0 && (
          <MentionSuggest
            members={members}
            query={mentionQuery}
            selectedIndex={mentionIndex}
            onSelect={insertMention}
          />
        )}
      </AnimatePresence>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* File attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-lg p-2 text-muted hover:text-foreground hover:bg-card transition-colors"
          aria-label="Attach file"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onInput={handleTextareaInput}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay close to allow MentionSuggest mousedown
            setTimeout(() => closeMention(), 200);
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || (!text.trim() && files.length === 0)}
          className="shrink-0 rounded-lg bg-accent p-2.5 text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Send message"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>

      {/* Drag overlay hint */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-accent/10 backdrop-blur-sm rounded-lg pointer-events-none">
          <p className="text-accent font-medium">Drop files here</p>
        </div>
      )}
    </div>
  );
}
