"use client";

// ============================================================
// Mobile Navigation — Sheet-based sidebar for small screens
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavProps {
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
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

export function MobileNav({ userRole, isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 z-50 h-full w-60 bg-sidebar border-r border-sidebar-border md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 h-12 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-none bg-primary text-primary-foreground">
                  <Library className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-sm text-sidebar-foreground">LibraryOS</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-sidebar-foreground/50"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="px-2 py-3 space-y-0.5">
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
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 rounded-none px-2.5 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
