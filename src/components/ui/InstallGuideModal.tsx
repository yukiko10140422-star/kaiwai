"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui";

const STORAGE_KEY = "kaiwai_install_guide_shown";

export default function InstallGuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const shown = localStorage.getItem(STORAGE_KEY);
      if (!shown) {
        // 初回ログインの人にだけ表示（WhatsNewModal の後に表示されるよう少し遅延）
        const timer = setTimeout(() => setOpen(true), 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  return (
    <Modal open={open} onClose={handleClose} className="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <p className="text-lg font-bold">アプリとして使えます</p>
          <p className="text-xs text-muted mt-0.5">ホーム画面に追加すると、もっと快適に</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* iPhone */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <rect width="12" height="20" x="6" y="2" rx="2" />
                <path d="M12 18h.01" />
              </svg>
              <span className="text-sm font-bold">iPhone / iPad</span>
            </div>
            <ol className="flex flex-col gap-1.5 text-sm pl-1">
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">1</span>
                <span><strong>Safari</strong> でこのページを開く</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">2</span>
                <span>画面下の <strong>共有ボタン</strong>（□に↑）をタップ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">3</span>
                <span>「<strong>ホーム画面に追加</strong>」を選ぶ</span>
              </li>
            </ol>
          </div>

          {/* Android */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <rect width="12" height="20" x="6" y="2" rx="2" />
                <path d="M12 18h.01" />
              </svg>
              <span className="text-sm font-bold">Android</span>
            </div>
            <ol className="flex flex-col gap-1.5 text-sm pl-1">
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">1</span>
                <span><strong>Chrome</strong> でこのページを開く</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">2</span>
                <span>右上の <strong>メニュー（⋮）</strong> をタップ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">3</span>
                <span>「<strong>ホーム画面に追加</strong>」または「<strong>アプリをインストール</strong>」を選ぶ</span>
              </li>
            </ol>
          </div>

          {/* PC */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <path d="M8 21h8" />
                <path d="M12 17v4" />
              </svg>
              <span className="text-sm font-bold">PC（Chrome / Edge）</span>
            </div>
            <p className="text-sm pl-1">アドレスバー右端の <strong>インストールアイコン</strong> をクリックするとアプリとして使えます</p>
          </div>
        </div>

        <p className="text-[11px] text-muted text-center">
          アプリ化すると通知バーやアドレスバーが消え、専用アプリのように使えます
        </p>

        <button
          onClick={handleClose}
          className="w-full rounded-lg bg-accent text-white py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
