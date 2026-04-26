"use server";

// ============================================================
// Report Server Actions
// ============================================================
// Generates dashboard statistics and various reports.
// ============================================================

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { calculateFine } from "@/lib/utils";
import type { DashboardStats } from "@/types";

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAuth();

  const [
    totalBooks,
    totalMembers,
    activeIssues,
    overdueBooks,
    finesResult,
    booksData,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.transaction.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count({
      where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    }),
    prisma.transaction.aggregate({
      where: { finePaid: true },
      _sum: { fineAmount: true },
    }),
    prisma.book.aggregate({
      _sum: { availableCopies: true },
    }),
  ]);

  return {
    totalBooks,
    totalMembers,
    activeIssues,
    overdueBooks,
    totalFinesCollected: finesResult._sum.fineAmount || 0,
    availableBooks: booksData._sum.availableCopies || 0,
  };
}

export async function getRecentActivity() {
  await requireAuth();

  return prisma.transaction.findMany({
    include: {
      book: { select: { title: true, author: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function getIssuedBooksReport(params?: {
  from?: string;
  to?: string;
}) {
  await requireAdmin();

  const where: Record<string, unknown> = { type: "ISSUE" };
  if (params?.from || params?.to) {
    where.issueDate = {};
    if (params?.from)
      (where.issueDate as Record<string, unknown>).gte = new Date(params.from);
    if (params?.to)
      (where.issueDate as Record<string, unknown>).lte = new Date(params.to);
  }

  return prisma.transaction.findMany({
    where,
    include: {
      book: { select: { title: true, author: true, isbn: true, category: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { issueDate: "desc" },
  });
}

export async function getOverdueReport() {
  await requireAdmin();

  const overdueTransactions = await prisma.transaction.findMany({
    where: {
      status: { in: ["ACTIVE", "OVERDUE"] },
      dueDate: { lt: new Date() },
    },
    include: {
      book: { select: { title: true, author: true, isbn: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return overdueTransactions.map((t) => ({
    ...t,
    calculatedFine: calculateFine(t.dueDate),
  }));
}

export async function getInventoryReport() {
  await requireAdmin();

  const books = await prisma.book.findMany({
    orderBy: { category: "asc" },
    select: {
      id: true,
      title: true,
      author: true,
      isbn: true,
      category: true,
      totalCopies: true,
      availableCopies: true,
      location: true,
    },
  });

  // Group by category
  const byCategory = books.reduce(
    (acc, book) => {
      if (!acc[book.category]) {
        acc[book.category] = { total: 0, available: 0, books: [] };
      }
      acc[book.category].total += book.totalCopies;
      acc[book.category].available += book.availableCopies;
      acc[book.category].books.push(book);
      return acc;
    },
    {} as Record<string, { total: number; available: number; books: typeof books }>
  );

  return { books, byCategory };
}

export async function getPurchaseReport() {
  await requireAdmin();

  const purchases = await prisma.purchase.findMany({
    include: {
      vendor: { select: { name: true } },
      items: true,
    },
    orderBy: { orderDate: "desc" },
  });

  const totalSpent = purchases
    .filter((p) => p.status === "RECEIVED")
    .reduce((sum, p) => sum + p.totalAmount, 0);

  return { purchases, totalSpent };
}

export async function getDamagedLostReport() {
  await requireAdmin();

  return prisma.transaction.findMany({
    where: {
      condition: { in: ["DAMAGED", "LOST"] },
    },
    include: {
      book: { select: { title: true, author: true, isbn: true, category: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
