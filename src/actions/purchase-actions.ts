"use server";

// ============================================================
// Purchase Server Actions
// ============================================================
// Manages purchase orders, vendors, and stock updates on
// receipt of purchases.
// ============================================================

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const purchaseItemSchema = z.object({
  title: z.string().min(1),
  isbn: z.string().optional(),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
  bookId: z.string().optional(),
});

const purchaseSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item required"),
});

const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getPurchases(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();

  const { status, page = 1, limit = 20 } = params || {};
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true } },
        items: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchase.count({ where }),
  ]);

  return {
    purchases,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createPurchase(data: {
  vendorId: string;
  invoiceNumber?: string;
  notes?: string;
  items: { title: string; isbn?: string; quantity: number; unitPrice: number; bookId?: string }[];
}) {
  await requireAdmin();

  const validated = purchaseSchema.parse(data);
  const totalAmount = validated.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  await prisma.purchase.create({
    data: {
      vendorId: validated.vendorId,
      invoiceNumber: validated.invoiceNumber || null,
      notes: validated.notes || null,
      totalAmount,
      items: {
        create: validated.items.map((item) => ({
          title: item.title,
          isbn: item.isbn || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          bookId: item.bookId || null,
        })),
      },
    },
  });

  revalidatePath("/purchases");
  return { success: true };
}

export async function receivePurchase(purchaseId: string) {
  await requireAdmin();

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });

  if (!purchase) throw new Error("Purchase not found");
  if (purchase.status !== "PENDING") {
    throw new Error("Only pending purchases can be received");
  }

  // Update book stock for items linked to existing books
  const updates = purchase.items
    .filter((item) => item.bookId)
    .map((item) =>
      prisma.book.update({
        where: { id: item.bookId! },
        data: {
          totalCopies: { increment: item.quantity },
          availableCopies: { increment: item.quantity },
        },
      })
    );

  await prisma.$transaction([
    ...updates,
    prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: "RECEIVED" },
    }),
  ]);

  revalidatePath("/purchases");
  revalidatePath("/books");
  return { success: true };
}

export async function cancelPurchase(purchaseId: string) {
  await requireAdmin();

  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/purchases");
  return { success: true };
}

export async function getVendors() {
  await requireAdmin();
  return prisma.vendor.findMany({ orderBy: { name: "asc" } });
}

export async function createVendor(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const data = vendorSchema.parse(raw);

  await prisma.vendor.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
    },
  });

  revalidatePath("/purchases");
  return { success: true };
}
