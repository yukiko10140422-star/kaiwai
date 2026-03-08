"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification } from "@/types/database";
import { subscribeToNotifications } from "@/lib/notifications";
import NotificationToast from "./NotificationToast";

const TOAST_DURATION = 5000;
const MAX_TOASTS = 5;

interface ToastProviderProps {
  userId: string;
  children: React.ReactNode;
}

export default function ToastProvider({ userId, children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Notification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Schedule auto-dismiss for a toast
  const scheduleDismiss = useCallback((id: string) => {
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, TOAST_DURATION);
    timersRef.current.set(id, timer);
  }, []);

  // Dismiss a toast manually
  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(userId, (notification) => {
      // In-app toast
      setToasts((prev) => {
        const next = [notification, ...prev];
        // Cap at MAX_TOASTS
        if (next.length > MAX_TOASTS) {
          const removed = next.pop();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return next;
      });
      scheduleDismiss(notification.id);

      // Native browser notification when tab is not focused
      if (
        typeof document !== "undefined" &&
        document.hidden &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(notification.title, {
          body: notification.body ?? undefined,
          icon: "/icon-192x192.png",
        });
      }
    });

    return () => {
      unsubscribe();
      // Clean up all timers
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [userId, scheduleDismiss]);

  return (
    <>
      {children}

      {/* Toast container — bottom-right, above everything */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2"
        aria-label="通知"
      >
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            notification={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </>
  );
}
