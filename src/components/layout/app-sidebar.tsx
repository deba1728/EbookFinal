"use client";

// ============================================================
// AppSidebar — Built entirely with shadcn/ui Sidebar primitives
// ============================================================
// Uses SidebarProvider context (useState internally).
// SidebarTrigger in the navbar acts as the hamburger toggle.
// collapsible="offcanvas":
//   • Desktop → slides in/out, main content shifts via SidebarInset
//   • Mobile  → renders as a Sheet (overlay drawer)
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  ShoppingCart,
  BarChart3,
  Settings,
  Library,
  LogOut,
  ChevronsUpDown,
  ClipboardCheck,
  Bell,
  BookMarked,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { getPendingRegistrationCount } from "@/actions/registration-actions";

interface AppSidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    adminOnly: false,
    userOnly: false,
  },
  {
    title: "Books",
    href: "/books",
    icon: BookOpen,
    adminOnly: false,
    userOnly: false,
  },
  {
    title: "My Books",
    href: "/my-books",
    icon: BookMarked,
    adminOnly: false,
    userOnly: true,
  },
  {
    title: "Members",
    href: "/members",
    icon: Users,
    adminOnly: true,
    userOnly: false,
  },
  {
    title: "Registrations",
    href: "/registrations",
    icon: ClipboardCheck,
    adminOnly: true,
    userOnly: false,
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
    adminOnly: false,
    userOnly: false,
  },
  {
    title: "Purchases",
    href: "/purchases",
    icon: ShoppingCart,
    adminOnly: true,
    userOnly: false,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    adminOnly: true,
    userOnly: false,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    adminOnly: false,
    userOnly: false,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    adminOnly: false,
    userOnly: false,
  },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const [pendingCount, setPendingCount] = useState(0);

  const handleNavSelect = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
      return;
    }

    setOpen(false);
  }, [isMobile, setOpen, setOpenMobile]);

  const fetchPendingCount = useCallback(async () => {
    if (user.role !== "admin") return;
    try {
      const count = await getPendingRegistrationCount();
      setPendingCount(count);
    } catch {
      // Silently fail
    }
  }, [user.role]);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  const filteredItems = navItems.filter((item) => {
    if (user.role === "admin") return !item.userOnly;
    return !item.adminOnly;
  });

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    // collapsible="offcanvas":
    //   - Desktop: sidebar slides in/out (translate-x), content shifts via SidebarInset gap div
    //   - Mobile:  renders inside a shadcn Sheet (overlay) with dark backdrop
    <Sidebar collapsible="offcanvas">
      {/* ── Logo / Brand ──────────────────────────────────────── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center bg-primary text-primary-foreground">
                  <Library className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LibraryOS</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Management System
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Navigation links ──────────────────────────────────── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={handleNavSelect}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>

                    {/* Pending count badge on Registrations */}
                    {item.href === "/registrations" && pendingCount > 0 && (
                      <SidebarMenuBadge className="bg-destructive text-destructive-foreground text-[10px]">
                        {pendingCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User footer / sign-out ────────────────────────────── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-none">
                    <AvatarFallback className="rounded-none bg-primary/10 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.name || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-none">
                      <AvatarFallback className="rounded-none bg-primary/10 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.name || "User"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Drag-handle rail (desktop) */}
      <SidebarRail />
    </Sidebar>
  );
}
