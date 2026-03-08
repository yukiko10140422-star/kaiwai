"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui";

/**
 * アプリのアップデート履歴。
 * 新しいバージョンを先頭に追加する。
 * version を上げると、未読のユーザーにモーダルが表示される。
 */
const CURRENT_VERSION = "1.6.0";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  items: { type: "new" | "improve" | "fix"; text: string }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "1.6.0",
    date: "2026-03-08",
    title: "タスク管理がパワーアップ",
    items: [
      { type: "new", text: "タスクの担当者を編集画面から変更できるようになりました" },
      { type: "new", text: "タスクにコメントを書いて、チームで相談できるようになりました" },
      { type: "improve", text: "ダークモードの見やすさを改善しました" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-03-08",
    title: "メッセージ・タスクがもっと便利に",
    items: [
      { type: "new", text: "送ったメッセージを後から取り消したり、内容を編集できるようになりました" },
      { type: "new", text: "作ったタスクの内容をあとから変更できるようになりました" },
      { type: "new", text: "タスクに場所を入れると、Google Mapsの地図が表示されるようになりました" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-03-08",
    title: "タスク・チャットの機能追加",
    items: [
      { type: "new", text: "タスクに「時間」と「場所」を設定できるようになりました" },
      { type: "new", text: "チャットにYouTubeのリンクを貼ると動画プレビューが表示されます" },
      { type: "new", text: "議事録にファイルを添付できるようになりました" },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-03-07",
    title: "見た目の改善・動作の高速化",
    items: [
      { type: "improve", text: "チャットがLINE風のレイアウトになりました（自分のメッセージが右側に表示）" },
      { type: "improve", text: "アプリの表示速度が大幅に向上しました" },
      { type: "fix", text: "iPhoneのホーム画面から開いたときの表示を修正しました" },
    ],
  },
];

const typeLabel: Record<string, { label: string; color: string }> = {
  new: { label: "NEW", color: "bg-accent text-white" },
  improve: { label: "改善", color: "bg-green-500/20 text-green-500" },
  fix: { label: "修正", color: "bg-amber-500/20 text-amber-500" },
};

const STORAGE_KEY = "kaiwai_whats_new_dismissed";

export default function WhatsNewModal() {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // 毎回ログイン時に表示。セッション中に閉じたら再表示しない
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed !== CURRENT_VERSION) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {
      // ignore
    }
  };

  const entries = showAll ? changelog : changelog.slice(0, 1);

  return (
    <Modal open={open} onClose={handleClose} className="max-w-sm">
      <div className="flex flex-col gap-4">
        {/* Header without × button */}
        <div className="text-center">
          <p className="text-lg font-bold">アップデート情報</p>
          <p className="text-xs text-muted mt-0.5">KAIWAIの最新の変更点</p>
        </div>

        {entries.map((entry) => (
          <div key={entry.version}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold">{entry.title}</span>
            </div>
            <p className="text-[11px] text-muted mb-2">{entry.date}</p>
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
          className="w-full rounded-lg bg-accent text-white py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors mt-1"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
