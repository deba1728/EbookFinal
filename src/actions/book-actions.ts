"use server";

// ============================================================
// Book Server Actions
// ============================================================
// CRUD operations for books with advanced search, category
// filtering, and stock tracking.
// ============================================================

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Validation Schemas ──────────────────────────────────────

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().min(10, "ISBN must be at least 10 characters"),
  publisher: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  subject: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  totalCopies: z.coerce.number().min(1, "Must have at least 1 copy"),
  location: z.string().optional(),
});

// ── Helper: Check Admin ─────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized: Please sign in");
  }
  return session;
}

// ── Actions ─────────────────────────────────────────────────

export async function getBooks(params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  await requireAuth();

  const { search, category, page = 1, limit = 20 } = params || {};
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Advanced search across title, author, subject, ISBN
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
      { isbn: { contains: search } },
      { subject: { contains: search } },
    ];
  }

  if (category) {
    where.category = category;
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.book.count({ where }),
  ]);

  return { books, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBookById(id: string) {
  await requireAuth();

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      transactions: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!book) throw new Error("Book not found");
  return book;
}

export async function getCategories() {
  const categories = await prisma.book.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return categories.map((c) => c.category);
}

export async function createBook(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const data = bookSchema.parse(raw);

  const existingBook = await prisma.book.findUnique({
    where: { isbn: data.isbn },
  });
  if (existingBook) {
    throw new Error("A book with this ISBN already exists");
  }

  await prisma.book.create({
    data: {
      ...data,
      availableCopies: data.totalCopies,
      coverImage: data.coverImage || null,
      publisher: data.publisher || null,
      subject: data.subject || null,
      description: data.description || null,
      location: data.location || null,
    },
  });

  revalidatePath("/books");
  return { success: true };
}

export async function updateBook(id: string, formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const data = bookSchema.parse(raw);

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new Error("Book not found");

  // Adjust available copies based on total change
  const copiesDiff = data.totalCopies - book.totalCopies;
  const newAvailable = Math.max(0, book.availableCopies + copiesDiff);

  await prisma.book.update({
    where: { id },
    data: {
      ...data,
      availableCopies: newAvailable,
      coverImage: data.coverImage || null,
      publisher: data.publisher || null,
      subject: data.subject || null,
      description: data.description || null,
      location: data.location || null,
    },
  });

  revalidatePath("/books");
  revalidatePath(`/books/${id}`);
  return { success: true };
}

export async function deleteBook(id: string) {
  await requireAdmin();

  // Check for active transactions
  const activeTransactions = await prisma.transaction.count({
    where: { bookId: id, status: "ACTIVE" },
  });

  if (activeTransactions > 0) {
    throw new Error("Cannot delete book with active transactions");
  }

  await prisma.book.delete({ where: { id } });

  revalidatePath("/books");
  return { success: true };
}
