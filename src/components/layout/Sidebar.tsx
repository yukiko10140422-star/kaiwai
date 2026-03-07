"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import ChannelList from "./ChannelList";
import DmList from "./DmList";

interface UserInfo {
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

interface SidebarProps {
  user: UserInfo;
}

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: HomeIcon },
  { href: "/dashboard/chat", label: "チャット", icon: ChatIcon },
  { href: "/dashboard/tasks", label: "タスク", icon: TaskIcon },
  { href: "/dashboard/projects", label: "プロジェクト", icon: ProjectIcon },
  { href: "/dashboard/notes", label: "議事録", icon: NotesIcon },
  { href: "/dashboard/progress", label: "進捗", icon: ProgressIcon },
  { href: "/dashboard/settings", label: "設定", icon: SettingsIcon },
];

// Mobile bottom nav: only show key tabs
const mobileNavItems = [
  { href: "/dashboard", label: "ホーム", icon: HomeIcon },
  { href: "/dashboard/chat", label: "チャット", icon: ChatIcon },
  { href: "/dashboard/tasks", label: "タスク", icon: TaskIcon },
  { href: "/dashboard/projects", label: "PJ", icon: ProjectIcon },
  { href: "/dashboard/settings", label: "設定", icon: SettingsIcon },
];

const sidebarVariants = {
  expanded: { width: 256 },
  collapsed: { width: 64 },
};

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col h-screen bg-sidebar/90 backdrop-blur-md border-r border-border shrink-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-border">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                key="logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-extrabold text-lg whitespace-nowrap gradient-text"
              >
                KAIWAI
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-card transition-colors shrink-0"
            aria-label={isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
          >
            <CollapseIcon collapsed={isCollapsed} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-card hover:text-foreground"
                }`}
                title={isCollapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      key={label}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

          {/* Channel list */}
          <div className="border-t border-border mt-2 pt-2">
            <ChannelList isCollapsed={isCollapsed} />
          </div>

          {/* DM list */}
          <div className="border-t border-border mt-2 pt-2">
            <DmList isCollapsed={isCollapsed} />
          </div>
        </nav>

        {/* User profile */}
        <div className="p-3 border-t border-border">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-card transition-colors"
          >
            <Avatar
              name={user.displayName}
              src={user.avatarUrl}
              size="sm"
            />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  key="userinfo"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-medium truncate max-w-[160px]">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted truncate max-w-[160px]">
                    {user.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-lg text-muted hover:bg-card hover:text-foreground transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "サインアウト" : undefined}
          >
            <SignOutIcon className="w-5 h-5 shrink-0" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  key="signout"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  サインアウト
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Mobile slide-out sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-border z-50 flex flex-col overflow-y-auto"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between p-4 h-16 border-b border-border">
                <span className="font-bold text-lg">KAIWAI</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-card transition-colors"
                  aria-label="閉じる"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                  const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-card hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-medium">{label}</span>
                    </Link>
                  );
                })}
                <div className="border-t border-border mt-2 pt-2">
                  <ChannelList isCollapsed={false} />
                </div>
                <div className="border-t border-border mt-2 pt-2">
                  <DmList isCollapsed={false} />
                </div>
              </nav>
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar name={user.displayName} src={user.avatarUrl} size="sm" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-lg text-muted hover:bg-card hover:text-foreground transition-colors"
                >
                  <SignOutIcon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">サインアウト</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom bar */}
      <MobileNav pathname={pathname} />
    </>
  );
}

/* ---- Mobile Components ---- */

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-border flex justify-around py-1.5 z-30 safe-bottom">
      {mobileNavItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
              isActive ? "text-accent" : "text-muted"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ---- Icons (inline SVG) ---- */

function CollapseIcon({
  collapsed,
  className = "",
}: {
  collapsed: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {collapsed ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      )}
    </svg>
  );
}

function ChatIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function HomeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
    </svg>
  );
}

function TaskIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ProgressIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SignOutIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ProjectIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function NotesIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SettingsIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
