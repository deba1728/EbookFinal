"use client";

// ============================================================
// Dashboard Client Component
// ============================================================
// Role-based dashboard: Admin sees full stats + recent
// activity. Student sees personal borrowing stats and a
// prompt to browse books.
// ============================================================

import { motion } from "framer-motion";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// Admin stat cards
const adminStatCards = [
  { key: "totalBooks", label: "Total Books", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "totalMembers", label: "Total Members", icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
  { key: "activeIssues", label: "Active Issues", icon: ArrowLeftRight, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "overdueBooks", label: "Overdue Books", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  { key: "totalFinesCollected", label: "Fines Collected", icon: IndianRupee, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "availableBooks", label: "Available Books", icon: BookCheck, color: "text-teal-500", bg: "bg-teal-500/10" },
];

// Student stat cards (subset)
const studentStatCards = [
  { key: "totalBooks", label: "Total Books", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "availableBooks", label: "Available Books", icon: BookCheck, color: "text-teal-500", bg: "bg-teal-500/10" },
  { key: "activeIssues", label: "Your Active Loans", icon: BookMarked, color: "text-violet-500", bg: "bg-violet-500/10" },
];

export function DashboardClient({ stats, recentActivity, userRole }: DashboardClientProps) {
  const isAdmin = userRole === "admin";
  const statCards = isAdmin ? adminStatCards : studentStatCards;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={
          isAdmin
            ? "Welcome to LibraryOS. Here's an overview of your library."
            : "Welcome to LibraryOS. Here's your personal overview."
        }
      />

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-3"}`}
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof DashboardStats];
          const displayValue =
            card.key === "totalFinesCollected"
              ? formatCurrency(value)
              : value.toString();

          return (
            <motion.div key={card.key} variants={itemVariants}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="text-3xl font-bold tracking-tight">
                        {displayValue}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-none ${card.bg} transition-transform group-hover:scale-110`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Student Quick Actions */}
      {!isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                  <Link href="/books">
                    <Search className="h-5 w-5" />
                    <span className="text-sm">Browse Books</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                  <Link href="/my-books">
                    <BookMarked className="h-5 w-5" />
                    <span className="text-sm">My Books</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                    <span className="text-sm">Notifications</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity (shown for both roles) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No recent transactions</p>
                <p className="text-xs mt-1">Transactions will appear here once books are issued</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="flex items-center justify-between p-2.5 rounded-none bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-none bg-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.book.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.user.name} · {activity.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <Badge className={getStatusColor(activity.status)} variant="outline">
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:block">
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
