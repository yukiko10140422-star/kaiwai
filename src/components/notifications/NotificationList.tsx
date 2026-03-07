"use client";

import { motion } from "framer-motion";
import {
  AtSign,
  ClipboardList,
  Clock,
  MessageSquare,
  UserPlus,
  Mail,
  Bell,
} from "lucide-react";
import type { Notification } from "@/types/database";
import { formatRelativeTime } from "@/lib/notifications";

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

export default function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationListProps) {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const iconMap: Record<string, React.ElementType> = {
    mention: AtSign,
    task_assigned: ClipboardList,
    task_due: Clock,
    task_comment: MessageSquare,
    channel_invite: UserPlus,
    dm_message: Mail,
  };

  function NotificationIcon({ type }: { type: string }) {
    const IconComponent = iconMap[type] ?? Bell;
    return (
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
        <IconComponent className="w-4 h-4 text-accent" />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass rounded-2xl shadow-xl z-50 overflow-hidden"
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">通知</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-accent hover:underline"
            >
              すべて既読
            </button>
          )}
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors text-lg leading-none"
            aria-label="閉じる"
          >
            &times;
          </button>
        </div>
      </div>

      {/* 通知リスト */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted">
            通知はありません
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => {
                if (!notification.is_read) {
                  onMarkAsRead(notification.id);
                }
              }}
              className={`w-full text-left px-4 py-3 flex gap-3 border-b border-border/50 transition-colors hover:bg-border/20 ${
                notification.is_read ? "opacity-60" : ""
              }`}
            >
              {/* アイコン */}
              <NotificationIcon type={notification.type} />

              {/* コンテンツ */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {notification.title}
                </p>
                {notification.body && (
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">
                    {notification.body}
                  </p>
                )}
                <p className="text-xs text-muted mt-1">
                  {formatRelativeTime(notification.created_at)}
                </p>
              </div>

              {/* 未読ドット */}
              {!notification.is_read && (
                <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2" />
              )}
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}
