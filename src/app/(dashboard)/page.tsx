// ============================================================
// Dashboard Home Page
// ============================================================
// Displays role-based dashboard: admin sees full stats +
// pending registrations; student sees personal borrowing info.
// ============================================================

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDashboardStats, getRecentActivity } from "@/actions/report-actions";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  let stats, recentActivity, userRole = "user";

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    userRole = (session?.user as Record<string, unknown>)?.role as string || "user";

    [stats, recentActivity] = await Promise.all([
      getDashboardStats(),
      getRecentActivity(),
    ]);
  } catch {
    // If session is not available during SSR, render empty
    stats = {
      totalBooks: 0,
      totalMembers: 0,
      activeIssues: 0,
      overdueBooks: 0,
      totalFinesCollected: 0,
      availableBooks: 0,
    };
    recentActivity = [];
  }

  return (
    <DashboardClient
      stats={stats}
      recentActivity={recentActivity}
      userRole={userRole}
    />
  );
}
