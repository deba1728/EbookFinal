"use server";

// ============================================================
// Member Server Actions
// ============================================================
// Admin-only member management with borrow history tracking.
// ============================================================

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getMembers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();

  const { search, page = 1, limit = 20 } = params || {};
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
        _count: {
          select: {
            transactions: { where: { status: "ACTIVE" } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    members: members.map((m) => ({
      ...m,
      activeLoans: m._count.transactions,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMemberById(id: string) {
  await requireAdmin();

  const member = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      banReason: true,
      createdAt: true,
      transactions: {
        include: {
          book: { select: { id: true, title: true, author: true, isbn: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!member) throw new Error("Member not found");
  return member;
}

export async function getAllUsers() {
  await requireAdmin();

  return prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
