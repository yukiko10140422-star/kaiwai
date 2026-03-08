"use client";

import { useState } from "react";

interface GuideSection {
  title: string;
  items: string[];
}

const guides: GuideSection[] = [
  {
    title: "チャット",
    items: [
      "サイドバーのチャンネル名をタップするとチャット画面が開きます",
      "メッセージを入力して送信ボタン（またはEnterキー）で送信できます",
      "画像やファイルはクリップボタンから添付できます",
      "自分のメッセージは右側に青く表示されます",
      "自分のメッセージの「...」メニューから、取り消し（削除）や編集ができます",
      "YouTubeのリンクを貼ると、動画のプレビューが自動で表示されます",
      "「@名前」で特定のメンバーにメンション（通知）を送れます",
    ],
  },
  {
    title: "ダイレクトメッセージ（DM）",
    items: [
      "サイドバーの「DM」セクションから相手を選んで1対1のメッセージができます",
      "チャットと同じく、メッセージの取り消し・編集が可能です",
    ],
  },
  {
    title: "タスク管理",
    items: [
      "「タスクボード」画面で、すべてのタスクをカンバン形式で確認できます",
      "「+ タスク追加」ボタンで新しいタスクを作成できます",
      "タスクには期限（日付・時間）、場所、担当者、優先度を設定できます",
      "場所を入力すると Google Maps の地図が表示されます",
      "タスクカードをドラッグ＆ドロップでステータスを変更できます（PC）",
      "タスクをタップすると詳細が表示され、「編集」ボタンで内容を変更できます",
    ],
  },
  {
    title: "議事録",
    items: [
      "「議事録」画面でミーティングの記録を作成・管理できます",
      "タイトル、日付、内容を入力して保存します",
      "クリップボタンからファイル（PDF、画像など）を添付できます",
    ],
  },
  {
    title: "通知",
    items: [
      "ヘッダーのベルマークで未読の通知を確認できます",
      "メンション、タスクの割り当て、DMなどの通知が届きます",
    ],
  },
  {
    title: "検索",
    items: [
      "ヘッダーの検索バーからメッセージやタスクを横断検索できます",
      "PCでは「/」キーですぐに検索を開けます",
    ],
  },
  {
    title: "スマホでの使い方",
    items: [
      "ブラウザのメニューから「ホーム画面に追加」でアプリのように使えます",
      "サイドバーは左上のメニューボタンで開閉できます",
    ],
  },
];

export default function UsageGuide() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  };

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-3">使い方ガイド</h3>
      <p className="text-sm text-muted mb-4">各機能の使い方をタップして確認できます</p>

      <div className="flex flex-col gap-1">
        {guides.map((section) => {
          const isOpen = openSection === section.title;
          return (
            <div key={section.title} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(section.title)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-card transition-colors text-left"
              >
                {section.title}
                <svg
                  className={`w-4 h-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <ul className="px-4 pb-3 flex flex-col gap-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
