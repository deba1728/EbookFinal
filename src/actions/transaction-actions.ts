"use server";

// ============================================================
// Transaction Server Actions
// ============================================================
// Handles book issuing, returning, renewal, and fine
// calculation. Includes automatic overdue detection.
// ============================================================

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification-actions";
import {
  generateDueDate,
  calculateFine,
  getMaxRenewals,
  getMaxBooksPerUser,
  getLoanPeriodDays,
} from "@/lib/utils";

// ── Helper: Auth ────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized: Please sign in");
  return session;
}

// ── Actions ─────────────────────────────────────────────────

export async function issueBook(bookId: string, userId: string) {
  await requireAdmin();

  // Check book availability
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error("Book not found");
  if (book.availableCopies <= 0) throw new Error("No copies available");

  // Check user's active loans
  const activeLoans = await prisma.transaction.count({
    where: { userId, status: "ACTIVE" },
  });
  if (activeLoans >= getMaxBooksPerUser()) {
    throw new Error(`User has reached the maximum limit of ${getMaxBooksPerUser()} active loans`);
  }

  // Check if user already has this book
  const existingLoan = await prisma.transaction.findFirst({
    where: { bookId, userId, status: "ACTIVE" },
  });
  if (existingLoan) {
    throw new Error("User already has an active loan for this book");
  }

  // Create transaction and update book stock
  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        bookId,
        userId,
        type: "ISSUE",
        dueDate: generateDueDate(),
        status: "ACTIVE",
      },
    }),
    prisma.book.update({
      where: { id: bookId },
      data: { availableCopies: { decrement: 1 } },
    }),
  ]);

  // Notify the user about the book issue
  await createNotification(
    userId,
    "BOOK_ISSUED",
    "Book Issued",
    `"${book.title}" has been issued to you. Due date: ${generateDueDate().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
  );

  revalidatePath("/transactions");
  revalidatePath("/books");
  revalidatePath("/");
  return { success: true };
}

export async function returnBook(transactionId: string) {
  await requireAdmin();

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });
  if (!transaction) throw new Error("Transaction not found");
  if (transaction.status !== "ACTIVE" && transaction.status !== "OVERDUE") {
    throw new Error("This book has already been returned");
  }

  const fine = calculateFine(transaction.dueDate);
  const now = new Date();

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "RETURNED",
        returnDate: now,
        fineAmount: fine,
        finePaid: fine === 0,
      },
    }),
    prisma.book.update({
      where: { id: transaction.bookId },
      data: { availableCopies: { increment: 1 } },
    }),
  ]);

  // Notify the user about the book return
  const book = await prisma.book.findUnique({ where: { id: transaction.bookId } });
  const fineMsg = fine > 0 ? ` A fine of ₹${fine} has been applied.` : "";
  await createNotification(
    transaction.userId,
    "BOOK_RETURNED",
    "Book Returned",
    `"${book?.title || "Book"}" has been returned successfully.${fineMsg}`
  );

  revalidatePath("/transactions");
  revalidatePath("/books");
  revalidatePath("/");
  return { success: true, fine };
}

export async function renewBook(transactionId: string) {
  await requireAdmin();

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });
  if (!transaction) throw new Error("Transaction not found");
  if (transaction.status !== "ACTIVE") {
    throw new Error("Only active loans can be renewed");
  }
  if (transaction.renewCount >= getMaxRenewals()) {
    throw new Error(`Maximum ${getMaxRenewals()} renewals allowed`);
  }

  // Extend due date from current due date
  const newDueDate = new Date(transaction.dueDate);
  newDueDate.setDate(newDueDate.getDate() + getLoanPeriodDays());

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      dueDate: newDueDate,
      renewCount: { increment: 1 },
      type: "RENEWAL",
    },
  });

  // Notify the user about the renewal
  const book = await prisma.book.findUnique({ where: { id: transaction.bookId } });
  await createNotification(
    transaction.userId,
    "BOOK_RENEWED",
    "Book Renewed",
    `"${book?.title || "Book"}" has been renewed. New due date: ${newDueDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
  );

  revalidatePath("/transactions");
  return { success: true, newDueDate };
}

export async function getTransactions(params?: {
  status?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const session = await requireAuth();
  const { status, userId, search, page = 1, limit = 20 } = params || {};
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Non-admin users can only see their own transactions
  if (session.user.role !== "admin") {
    where.userId = session.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { book: { title: { contains: search } } },
      { book: { isbn: { contains: search } } },
      { user: { name: { contains: search } } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        book: { select: { id: true, title: true, author: true, isbn: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOverdueTransactions() {
  await requireAdmin();

  const overdueTransactions = await prisma.transaction.findMany({
    where: {
      status: "ACTIVE",
      dueDate: { lt: new Date() },
    },
    include: {
      book: { select: { id: true, title: true, author: true, isbn: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // Mark as overdue in DB
  for (const t of overdueTransactions) {
    await prisma.transaction.update({
      where: { id: t.id },
      data: { status: "OVERDUE", fineAmount: calculateFine(t.dueDate) },
    });
  }

  return overdueTransactions;
}

export async function payFine(transactionId: string) {
  await requireAdmin();

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { finePaid: true },
  });

  revalidatePath("/transactions");
  return { success: true };
}
