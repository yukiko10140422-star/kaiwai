"use client";

import { useState, useEffect } from "react";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
} from "@/lib/browser-notifications";

export default function NotificationPermission() {
  const [permission, setPermission] = useState<string>("default");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? "granted" : "denied");
  };

  if (!supported) return null;

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-2">ブラウザ通知</h3>
      <p className="text-sm text-muted mb-3">
        タブを閉じていても通知を受け取れます
      </p>
      {permission === "granted" ? (
        <div className="flex items-center gap-2 text-sm text-status-done">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          通知は有効です
        </div>
      ) : permission === "denied" ? (
        <p className="text-sm text-muted">
          通知がブロックされています。ブラウザの設定から許可してください。
        </p>
      ) : (
        <button
          onClick={handleEnable}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          通知を有効にする
        </button>
      )}
    </section>
  );
}
