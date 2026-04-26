"use client";

// ============================================================
// Dashboard Client Component — UI/UX refined
// ============================================================
// Role-based dashboard: Admin sees full stats + recent
// activity. Student sees personal borrowing stats and a
// prompt to browse books.
// ============================================================

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  ArrowLeftRight,
  AlertTriangle,
  IndianRupee,
  BookCheck,
  BookMarked,
  Search,
  Bell,
} from "lucide-react";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface DashboardClientProps {
  stats: DashboardStats;
  recentActivity: {
    id: string;
    type: string;
    status: string;
    issueDate: Date;
    dueDate: Date;
    book: { title: string; author: string };
    user: { name: string; email: string };
  }[];
  userRole: string;
}

// ── Animation variants ──────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// ── Stat card definitions ───────────────────────────────────

const adminStatCards = [
  { key: "totalBooks",           label: "Total Books",       icon: BookOpen,       color: "text-blue-500",   bg: "bg-blue-500/10"   },
  { key: "totalMembers",         label: "Total Members",     icon: Users,          color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "activeIssues",         label: "Active Issues",     icon: ArrowLeftRight, color: "text-emerald-500",bg: "bg-emerald-500/10"},
  { key: "overdueBooks",         label: "Overdue Books",     icon: AlertTriangle,  color: "text-red-500",    bg: "bg-red-500/10"    },
  { key: "totalFinesCollected",  label: "Fines Collected",   icon: IndianRupee,    color: "text-amber-500",  bg: "bg-amber-500/10"  },
  { key: "availableBooks",       label: "Available Books",   icon: BookCheck,      color: "text-teal-500",   bg: "bg-teal-500/10"   },
];

const studentStatCards = [
  { key: "totalBooks",    label: "Total Books",       icon: BookOpen,   color: "text-blue-500",   bg: "bg-blue-500/10"   },
  { key: "availableBooks",label: "Available Books",   icon: BookCheck,  color: "text-teal-500",   bg: "bg-teal-500/10"   },
  { key: "activeIssues",  label: "Your Active Loans", icon: BookMarked, color: "text-violet-500", bg: "bg-violet-500/10" },
];

// ── Component ───────────────────────────────────────────────

export function DashboardClient({ stats, recentActivity, userRole }: DashboardClientProps) {
  const isAdmin   = userRole === "admin";
  const statCards = isAdmin ? adminStatCards : studentStatCards;

  return (
    <div className="space-y-8">

      {/* Page header */}
      <PageHeader
        title="Dashboard"
        description={
          isAdmin
            ? "Welcome to LibraryOS. Here's an overview of your library."
            : "Welcome to LibraryOS. Here's your personal overview."
        }
      />

      {/* ── Stat Cards Grid ─────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-3"}`}
      >
        {statCards.map((card) => {
          const Icon         = card.icon;
          const value        = stats[card.key as keyof DashboardStats];
          const displayValue =
            card.key === "totalFinesCollected"
              ? formatCurrency(value)
              : value.toString();

          return (
            <motion.div
              key={card.key}
              variants={itemVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">

                    {/* Label + value */}
                    <div className="space-y-2 min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="text-3xl font-bold tracking-tight leading-none">
                        {displayValue}
                      </p>
                    </div>

                    {/* Icon bubble */}
                    <div className={`shrink-0 p-3 ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>

                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Student Quick Actions ───────────────────────────── */}
      {!isAdmin && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2 border-border/60 hover:border-primary/30 hover:bg-accent transition-colors duration-200">
                  <Link href="/books">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Browse Books</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2 border-border/60 hover:border-primary/30 hover:bg-accent transition-colors duration-200">
                  <Link href="/my-books">
                    <BookMarked className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">My Books</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2 border-border/60 hover:border-primary/30 hover:bg-accent transition-colors duration-200">
                  <Link href="/notifications">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Notifications</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Recent Activity ─────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: isAdmin ? 0.3 : 0.45 }}
      >
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              {recentActivity.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {recentActivity.length} transaction{recentActivity.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {recentActivity.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <ArrowLeftRight className="h-8 w-8 opacity-25" />
                <p className="text-sm font-medium">No recent transactions</p>
                <p className="text-xs opacity-70">Transactions will appear here once books are issued</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.25, ease: "easeOut" }}
                    whileHover={{ backgroundColor: "var(--color-muted)", transition: { duration: 0.15 } }}
                    className="flex items-center justify-between gap-4 py-3 px-2 -mx-2 rounded-none transition-colors duration-150 cursor-default"
                  >
                    {/* Left — book info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Accent dot */}
                      <div className="h-2 w-2 shrink-0 rounded-full bg-primary/50" />

                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">
                          {activity.book.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          <span className="font-medium text-foreground/70">{activity.user.name}</span>
                          {" · "}
                          <span className="capitalize">{activity.type.toLowerCase()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right — badge + date */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 font-medium ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:block tabular-nums">
                        {formatDate(activity.issueDate)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
