"use client";

// ============================================================
// Sidebar Navigation — Role-Based
// ============================================================
// Collapsible sidebar with navigation items that are filtered
// based on the current user's role (admin vs user).
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  ShoppingCart,
  BarChart3,
  Settings,
  Library,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface SidebarProps {
  userRole: string;
}

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, adminOnly: false },
  { title: "Books", href: "/books", icon: BookOpen, adminOnly: false },
  { title: "Members", href: "/members", icon: Users, adminOnly: true },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight, adminOnly: false },
  { title: "Purchases", href: "/purchases", icon: ShoppingCart, adminOnly: true },
  { title: "Reports", href: "/reports", icon: BarChart3, adminOnly: true },
  { title: "Settings", href: "/settings", icon: Settings, adminOnly: false },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 60 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col h-screen sticky top-0 border-r bg-sidebar text-sidebar-foreground"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 h-12 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-7 h-7 rounded-none bg-primary text-primary-foreground">
          <Library className="w-4 h-4" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="font-semibold text-sm tracking-tight">LibraryOS</h2>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-none px-2.5 py-2 text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                )}
              />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {item.title}
                </motion.span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-0.5 h-5 bg-sidebar-primary-foreground/30"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Collapse toggle */}
      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
