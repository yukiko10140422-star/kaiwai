"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Locale = "ja" | "en";

const translations: Record<Locale, Record<string, string>> = {
  ja: {
    // Navigation
    "nav.home": "ホーム",
    "nav.chat": "チャット",
    "nav.tasks": "タスク",
    "nav.projects": "プロジェクト",
    "nav.notes": "議事録",
    "nav.progress": "進捗",
    "nav.settings": "設定",
    "nav.requests": "リクエスト",
    "nav.signout": "サインアウト",

    // Tasks
    "tasks.title": "タスクボード",
    "tasks.add": "+ タスク追加",
    "tasks.kanban": "カンバン",
    "tasks.gantt": "ガント",
    "tasks.todo": "未着手",
    "tasks.in_progress": "進行中",
    "tasks.review": "レビュー",
    "tasks.done": "完了",
    "tasks.priority.high": "高",
    "tasks.priority.medium": "中",
    "tasks.priority.low": "低",
    "tasks.edit": "編集",
    "tasks.delete": "削除",
    "tasks.save": "保存",
    "tasks.cancel": "キャンセル",

    // Settings
    "settings.title": "設定",
    "settings.profile": "プロフィール",
    "settings.profile.desc": "表示名やアバターを変更",
    "settings.profile.edit": "編集",
    "settings.theme": "テーマ",
    "settings.theme.dark": "ダーク",
    "settings.theme.light": "ライト",
    "settings.theme.system": "システム",
    "settings.language": "言語",
    "settings.notifications": "ブラウザ通知",
    "settings.notifications.desc": "タブを閉じていても通知を受け取れます",
    "settings.notifications.enabled": "通知は有効です",
    "settings.notifications.blocked": "通知がブロックされています。ブラウザの設定から許可してください。",
    "settings.notifications.enable": "通知を有効にする",
    "settings.invite": "メンバー招待",
    "settings.invite.desc": "新しいメンバーを招待",
    "settings.invite.manage": "管理",
    "settings.guide": "使い方ガイド",
    "settings.guide.desc": "各機能の使い方をタップして確認できます",
    "settings.password": "パスワード変更",
    "settings.password.label": "新しいパスワード",
    "settings.password.placeholder": "8文字以上",
    "settings.password.submit": "パスワードを変更",
    "settings.password.changing": "変更中…",
    "settings.password.min": "パスワードは8文字以上必要です",
    "settings.password.success": "パスワードを変更しました",
    "settings.password.error": "変更に失敗しました",

    // Common
    "common.loading": "読み込み中...",
    "common.error": "エラーが発生しました",
    "common.confirm_delete": "削除しますか？",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.close": "閉じる",
    "common.submit": "送信",
    "common.search": "検索",

    // Dashboard
    "dashboard.title": "進捗ダッシュボード",
    "dashboard.total_tasks": "全タスク",
    "dashboard.completed": "完了",
    "dashboard.in_progress": "進行中",
    "dashboard.overdue": "期限切れ",
    "dashboard.completion_rate": "全体進捗率",
    "dashboard.weekly_report": "週次レポート",
    "dashboard.activity": "アクティビティ",

    // Chat
    "chat.thread_reply": "スレッドで返信",
    "chat.edit": "編集",
    "chat.unsend": "取り消し",
    "chat.pin": "ピン留め",
    "chat.unpin": "ピン留めを解除",
    "chat.pinned": "ピン留めメッセージ",
    "chat.read": "既読",
    "chat.edited": "編集済み",

    // Sidebar
    "sidebar.open": "サイドバーを開く",
    "sidebar.close": "サイドバーを閉じる",
    "sidebar.mobile_pj": "PJ",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.chat": "Chat",
    "nav.tasks": "Tasks",
    "nav.projects": "Projects",
    "nav.notes": "Notes",
    "nav.progress": "Progress",
    "nav.settings": "Settings",
    "nav.requests": "Requests",
    "nav.signout": "Sign out",

    // Tasks
    "tasks.title": "Task Board",
    "tasks.add": "+ Add Task",
    "tasks.kanban": "Kanban",
    "tasks.gantt": "Gantt",
    "tasks.todo": "Todo",
    "tasks.in_progress": "In Progress",
    "tasks.review": "Review",
    "tasks.done": "Done",
    "tasks.priority.high": "High",
    "tasks.priority.medium": "Medium",
    "tasks.priority.low": "Low",
    "tasks.edit": "Edit",
    "tasks.delete": "Delete",
    "tasks.save": "Save",
    "tasks.cancel": "Cancel",

    // Settings
    "settings.title": "Settings",
    "settings.profile": "Profile",
    "settings.profile.desc": "Change display name and avatar",
    "settings.profile.edit": "Edit",
    "settings.theme": "Theme",
    "settings.theme.dark": "Dark",
    "settings.theme.light": "Light",
    "settings.theme.system": "System",
    "settings.language": "Language",
    "settings.notifications": "Browser Notifications",
    "settings.notifications.desc": "Receive notifications even when the tab is closed",
    "settings.notifications.enabled": "Notifications are enabled",
    "settings.notifications.blocked": "Notifications are blocked. Please enable them in your browser settings.",
    "settings.notifications.enable": "Enable Notifications",
    "settings.invite": "Invite Members",
    "settings.invite.desc": "Invite new members",
    "settings.invite.manage": "Manage",
    "settings.guide": "Usage Guide",
    "settings.guide.desc": "Tap each section to learn how to use the features",
    "settings.password": "Change Password",
    "settings.password.label": "New Password",
    "settings.password.placeholder": "8 or more characters",
    "settings.password.submit": "Change Password",
    "settings.password.changing": "Changing...",
    "settings.password.min": "Password must be at least 8 characters",
    "settings.password.success": "Password changed successfully",
    "settings.password.error": "Failed to change password",

    // Common
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.confirm_delete": "Are you sure you want to delete?",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.submit": "Submit",
    "common.search": "Search",

    // Dashboard
    "dashboard.title": "Progress Dashboard",
    "dashboard.total_tasks": "Total Tasks",
    "dashboard.completed": "Completed",
    "dashboard.in_progress": "In Progress",
    "dashboard.overdue": "Overdue",
    "dashboard.completion_rate": "Completion Rate",
    "dashboard.weekly_report": "Weekly Report",
    "dashboard.activity": "Activity",

    // Chat
    "chat.thread_reply": "Reply in thread",
    "chat.edit": "Edit",
    "chat.unsend": "Unsend",
    "chat.pin": "Pin",
    "chat.unpin": "Unpin",
    "chat.pinned": "Pinned Messages",
    "chat.read": "Read",
    "chat.edited": "edited",

    // Sidebar
    "sidebar.open": "Open sidebar",
    "sidebar.close": "Close sidebar",
    "sidebar.mobile_pj": "PJ",
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "ja",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ja");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kaiwai_locale");
      if (saved === "en" || saved === "ja") {
        setLocaleState(saved);
      }
    } catch {}
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("kaiwai_locale", newLocale);
    } catch {}
  };

  const t = (key: string): string => {
    return translations[locale][key] ?? translations.ja[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
