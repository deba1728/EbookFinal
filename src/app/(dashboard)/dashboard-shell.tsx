"use client";

// ============================================================
// DashboardShell — Root layout wrapper (shadcn Sidebar version)
// ============================================================
// SidebarProvider  → holds open/close state (useState internally)
// SidebarTrigger   → hamburger icon button in the top navbar
// SidebarInset     → main content area that shifts on desktop
//
// Behavior:
//   • Desktop (md+): sidebar is visible by default, SidebarInset
//     pushes content right when open, slides left when closed.
//     Transition: 300ms ease-linear (set in shadcn sidebar.tsx).
//   • Mobile:  sidebar hidden by default, SidebarTrigger opens
//     a Sheet overlay (dark backdrop + slide-in drawer).
// ============================================================

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

interface DashboardShellProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    // defaultOpen=true  → sidebar starts open on desktop
    // SidebarProvider internally uses useState to track open state
    // On mobile, SidebarProvider switches to openMobile state
    // and the Sidebar renders as a Sheet instead
    <SidebarProvider defaultOpen={true}>
      {/* ── Fixed left sidebar ──────────────────────────────── */}
      <AppSidebar user={user} />

      {/* ── Main content (shifts right on desktop when open) ── */}
      <SidebarInset>
        {/* ── Top Navbar ────────────────────────────────────── */}
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
          {/* Hamburger toggle — calls toggleSidebar() from SidebarProvider context */}
          <SidebarTrigger
            id="sidebar-toggle"
            className="h-8 w-8 -ml-1 flex items-center justify-center rounded-none border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          />

          <Separator orientation="vertical" className="mr-2 h-4" />

          {/* App name shown on mobile (sidebar hidden) */}
          <span className="text-sm font-semibold text-foreground md:hidden">
            LibraryOS
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right-side controls */}
          <NotificationBell />
          <ThemeToggle />
        </header>

        {/* ── Page content ──────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
