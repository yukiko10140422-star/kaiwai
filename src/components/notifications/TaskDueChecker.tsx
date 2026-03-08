"use client";

import { useEffect } from "react";
import { checkTaskDueNotifications } from "@/lib/task-due-check";

/**
 * タスク期限通知チェッカー
 * 1日1回（セッションごと）、期限切れ・本日期限・明日期限のタスクをチェックして通知を作成する
 * UIを持たない非表示コンポーネント
 */
export default function TaskDueChecker() {
  useEffect(() => {
    // Check once per day per session using sessionStorage with date key
    const key = "kaiwai_due_check_" + new Date().toISOString().split("T")[0];
    if (sessionStorage.getItem(key)) return;

    checkTaskDueNotifications()
      .then(() => sessionStorage.setItem(key, "1"))
      .catch(console.error);
  }, []);

  return null;
}
