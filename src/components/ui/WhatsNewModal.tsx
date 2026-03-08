"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui";

/**
 * アプリのアップデート履歴。
 * 新しいバージョンを先頭に追加する。
 * version を上げると、未読のユーザーにモーダルが表示される。
 */
const CURRENT_VERSION = "1.4.0";

interface ChangelogEntry {
  version: string;
  date: string;
  items: { type: "new" | "improve" | "fix"; text: string }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "1.4.0",
    date: "2026-03-08",
    items: [
      { type: "new", text: "メッセージの取り消し・編集ができるようになりました（自分のメッセージのみ）" },
      { type: "new", text: "タスクの編集機能を追加しました（タスク詳細画面から）" },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-03-08",
    items: [
      { type: "new", text: "タスクに時間指定・場所フィールドを追加" },
      { type: "new", text: "場所にGoogle Mapsを連携表示" },
      { type: "new", text: "チャットでYouTubeリンクのプレビュー表示" },
      { type: "new", text: "議事録にファイル添付機能を追加" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-07",
    items: [
      { type: "improve", text: "チャットをLINE風レイアウトに変更（自分のメッセージが右側）" },
      { type: "improve", text: "アプリ全体の軽量化（アニメーション削減・バンドルサイズ最適化）" },
      { type: "fix", text: "iOS PWAスタンドアローンモードの修正" },
    ],
  },
];

const typeLabel: Record<string, { label: string; color: string }> = {
  new: { label: "NEW", color: "bg-accent text-white" },
  improve: { label: "改善", color: "bg-green-500/20 text-green-500" },
  fix: { label: "修正", color: "bg-amber-500/20 text-amber-500" },
};

const STORAGE_KEY = "kaiwai_last_seen_version";

export default function WhatsNewModal() {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen !== CURRENT_VERSION) {
        setOpen(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {
      // ignore
    }
  };

  const entries = showAll ? changelog : changelog.slice(0, 1);

  return (
    <Modal open={open} onClose={handleClose} title="アップデート情報" className="max-w-sm">
      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <div key={entry.version}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold">v{entry.version}</span>
              <span className="text-xs text-muted">{entry.date}</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {entry.items.map((item, i) => {
                const badge = typeLabel[item.type];
                return (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span>{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {!showAll && changelog.length > 1 && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-accent hover:underline self-start"
          >
            過去のアップデートを見る
          </button>
        )}

        <button
          onClick={handleClose}
          className="w-full rounded-lg bg-accent text-white py-2 text-sm font-medium hover:bg-accent-hover transition-colors mt-1"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
