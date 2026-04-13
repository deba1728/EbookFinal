"use server";

// ============================================================
// Notification Server Actions
// ============================================================
// CRUD operations for in-app notifications with read/unread
// tracking. Used by other actions to trigger notifications
// on registration approval, book issues, overdue alerts, etc.
// ============================================================

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// ── Helper: Auth ────────────────────────────────────────────

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized: Please sign in");
  return session;
}

// ── Internal Helper ─────────────────────────────────────────

/**
 * Create a notification for a specific user.
 * Used internally by other server actions (registration, transactions, etc.)
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string
) {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
  });
}

// ── User-facing Actions ─────────────────────────────────────

/**
 * Get notifications for the currently authenticated user.
 * Returns paginated results, newest first.
 */
export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const session = await requireAuth();
  const { page = 1, limit = 20, unreadOnly = false } = params || {};
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (unreadOnly) {
    where.read = false;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get count of unread notifications for the bell badge.
 */
export async function getUnreadNotificationCount() {
  const session = await requireAuth();
  return prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  const session = await requireAuth();

  // Ensure the notification belongs to the current user
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== session.user.id) {
    throw new Error("Notification not found");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { success: true };
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsAsRead() {
  const session = await requireAuth();

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { success: true };
}

/**
 * Delete a notification.
 */
export async function deleteNotification(notificationId: string) {
  const session = await requireAuth();

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== session.user.id) {
    throw new Error("Notification not found");
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  revalidatePath("/notifications");
  return { success: true };
}
