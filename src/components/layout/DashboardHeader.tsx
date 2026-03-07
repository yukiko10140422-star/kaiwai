"use client";

import { NotificationBell } from "@/components/notifications";

interface DashboardHeaderProps {
  userId: string;
}

export default function DashboardHeader({ userId }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-end h-12 px-3 sm:px-4 border-b border-border bg-sidebar shrink-0">
      <NotificationBell userId={userId} />
    </header>
  );
}
