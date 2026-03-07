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

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  mention: AtSign,
  task_assigned: ClipboardList,
  task_due: Clock,
  task_comment: MessageSquare,
  channel_invite: UserPlus,
  dm_message: Mail,
};

export default function NotificationToast({
  notification,
  onDismiss,
}: NotificationToastProps) {
  const IconComponent = iconMap[notification.type] ?? Bell;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={() => onDismiss(notification.id)}
      className="pointer-events-auto w-80 cursor-pointer rounded-xl border border-border/50 p-4 shadow-lg backdrop-blur-xl"
      style={{
        background: "var(--glass-bg, rgba(15, 23, 42, 0.75))",
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
            {notification.title}
          </p>
          {notification.body && (
            <p
              className="mt-0.5 line-clamp-2 text-xs leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              {notification.body}
            </p>
          )}
        </div>

        {/* Close hint */}
        <span className="flex-shrink-0 text-xs" style={{ color: "var(--muted)" }}>
          &times;
        </span>
      </div>
    </motion.div>
  );
}
