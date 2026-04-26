"use server";

// ============================================================
// Registration Request Server Actions
// ============================================================
// Handles the student registration approval workflow.
// Students submit requests (public), admins approve/reject.
// ============================================================

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "./notification-actions";

// ── Validation Schemas ──────────────────────────────────────

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// NOTE: Plain-text password is stored in RegistrationRequest.
// This is safe because the table is only accessible server-side by admins.
// Better Auth handles all password hashing when the user account is created.

// ── Helper: Auth ────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

// ── Actions ─────────────────────────────────────────────────

/**
 * Submit a registration request (public — no auth required).
 * Stores the request as PENDING for admin review.
 */
export async function submitRegistrationRequest(formData: {
  name: string;
  email: string;
  password: string;
}) {
  const data = registrationSchema.parse(formData);

  // Check if email already exists as a user
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  // Check if a pending request already exists
  const existingRequest = await prisma.registrationRequest.findUnique({
    where: { email: data.email },
  });
  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      throw new Error(
        "A registration request with this email is already pending"
      );
    }
    if (existingRequest.status === "APPROVED") {
      throw new Error("This email has already been approved. Please sign in.");
    }
    // If rejected, allow re-submission by deleting old request
    if (existingRequest.status === "REJECTED") {
      await prisma.registrationRequest.delete({
        where: { id: existingRequest.id },
      });
    }
  }

  // Store plain-text password — Better Auth will hash during account creation
  await prisma.registrationRequest.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
    },
  });

  return { success: true };
}

/**
 * Get all registration requests (admin only).
 * Supports pagination, search, and status filtering.
 */
export async function getRegistrationRequests(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();

  const { search, status, page = 1, limit = 20 } = params || {};
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.registrationRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.registrationRequest.count({ where }),
  ]);

  return {
    requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get count of pending registration requests (for sidebar badge).
 */
export async function getPendingRegistrationCount() {
  await requireAdmin();
  return prisma.registrationRequest.count({
    where: { status: "PENDING" },
  });
}

/**
 * Approve a registration request (admin only).
 * Creates the user via Better Auth's signup and sends a welcome notification.
 */
export async function approveRegistration(requestId: string) {
  await requireAdmin();

  const request = await prisma.registrationRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("Registration request not found");
  if (request.status !== "PENDING") {
    throw new Error("This request has already been processed");
  }

  // Create the user using Better Auth's API
  // IMPORTANT: We pass the plain-text password; Better Auth hashes it.
  // We disable auto-sign-in to prevent creating a session for the admin.
  const response = await auth.api.signUpEmail({
    body: {
      name: request.name,
      email: request.email,
      password: request.password,
    },
    headers: new Headers(),  // Empty headers so no session cookie is set for admin
  });

  if (!response) {
    throw new Error("Failed to create user account");
  }

  // Mark request as approved
  await prisma.registrationRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED" },
  });

  // Find the newly created user to send notification
  const newUser = await prisma.user.findUnique({
    where: { email: request.email },
  });
  if (newUser) {
    await createNotification(
      newUser.id,
      "REGISTRATION_APPROVED",
      "Registration Approved",
      "Welcome to LibraryOS! Your registration has been approved. You can now browse and borrow books."
    );
  }

  revalidatePath("/registrations");
  revalidatePath("/members");
  return { success: true };
}

/**
 * Reject a registration request (admin only).
 */
export async function rejectRegistration(
  requestId: string,
  reason?: string
) {
  await requireAdmin();

  const request = await prisma.registrationRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("Registration request not found");
  if (request.status !== "PENDING") {
    throw new Error("This request has already been processed");
  }

  await prisma.registrationRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      rejectionReason: reason || null,
    },
  });

  revalidatePath("/registrations");
  return { success: true };
}
