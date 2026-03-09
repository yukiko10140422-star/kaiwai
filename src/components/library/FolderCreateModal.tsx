"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";

interface FolderCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function FolderCreateModal({ open, onClose, onCreate }: FolderCreateModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="新規フォルダ">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="フォルダ名"
          autoFocus
          className="w-full px-3 py-2 text-sm rounded-lg bg-card border border-border focus:border-accent focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose} variant="ghost" size="sm">
            キャンセル
          </Button>
          <Button type="submit" size="sm" disabled={!name.trim()}>
            作成
          </Button>
        </div>
      </form>
    </Modal>
  );
}
