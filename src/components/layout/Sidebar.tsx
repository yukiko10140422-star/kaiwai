"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
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
  { href: "/dashboard", labelKey: "nav.home", icon: HomeIcon },
  { href: "/dashboard/chat", labelKey: "nav.chat", icon: ChatIcon },
  { href: "/dashboard/tasks", labelKey: "nav.tasks", icon: TaskIcon },
  { href: "/dashboard/projects", labelKey: "nav.projects", icon: ProjectIcon },
  { href: "/dashboard/notes", labelKey: "nav.notes", icon: NotesIcon },
  { href: "/dashboard/library", labelKey: "nav.library", icon: LibraryIcon },
  { href: "/dashboard/progress", labelKey: "nav.progress", icon: ProgressIcon },
  { href: "/dashboard/requests", labelKey: "nav.requests", icon: RequestIcon },
  { href: "/dashboard/settings", labelKey: "nav.settings", icon: SettingsIcon },
];

// Mobile bottom nav: only show key tabs
const mobileNavItems = [
  { href: "/dashboard", labelKey: "nav.home", icon: HomeIcon },
  { href: "/dashboard/chat", labelKey: "nav.chat", icon: ChatIcon },
  { href: "/dashboard/tasks", labelKey: "nav.tasks", icon: TaskIcon },
  { href: "/dashboard/projects", labelKey: "sidebar.mobile_pj", icon: ProjectIcon },
  { href: "/dashboard/settings", labelKey: "nav.settings", icon: SettingsIcon },
];


export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

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
      <aside
        style={{ width: isCollapsed ? 64 : 256, transition: 'width 0.2s ease' }}
        className="hidden md:flex flex-col h-dvh bg-sidebar/90 backdrop-blur-md border-r border-border shrink-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-border">
          {!isCollapsed && (
              <span className="font-extrabold text-lg whitespace-nowrap gradient-text">
                KAIWAI
              </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-card transition-colors shrink-0"
            aria-label={isCollapsed ? t("sidebar.open") : t("sidebar.close")}
          >
            <CollapseIcon collapsed={isCollapsed} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, labelKey, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            const label = t(labelKey);

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
                {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{label}</span>}
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
            {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate max-w-[160px]">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted truncate max-w-[160px]">
                    {user.email}
                  </p>
                </div>
            )}
          </Link>
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-lg text-muted hover:bg-card hover:text-foreground transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? t("nav.signout") : undefined}
          >
            <SignOutIcon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{t("nav.signout")}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile slide-out sidebar */}
      {mobileOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-border z-50 flex flex-col overflow-y-auto"
              style={{ transform: 'translateX(0)', transition: 'transform 0.2s ease' }}
            >
              <div className="flex items-center justify-between p-4 h-16 border-b border-border">
                <span className="font-bold text-lg">KAIWAI</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-card transition-colors"
                  aria-label={t("common.close")}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {navItems.map(({ href, labelKey, icon: Icon }) => {
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
                      <span className="text-sm font-medium">{t(labelKey)}</span>
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
                  <span className="text-sm font-medium">{t("nav.signout")}</span>
                </button>
              </div>
            </aside>
          </>
      )}

      {/* Mobile bottom bar */}
      <MobileNav pathname={pathname} />
    </>
  );
}

/* ---- Mobile Components ---- */

function MobileNav({ pathname }: { pathname: string }) {
  const { t } = useI18n();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-border flex justify-around py-1.5 z-30 safe-bottom">
      {mobileNavItems.map(({ href, labelKey, icon: Icon }) => {
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
            <span className="text-[10px]">{t(labelKey)}</span>
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

function RequestIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function LibraryIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
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
