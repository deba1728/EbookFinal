// ============================================================
// Utility Functions
// ============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind CSS classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date to a readable string */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format currency */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Calculate fine for overdue books */
export function calculateFine(dueDate: Date): number {
  const now = new Date();
  const due = new Date(dueDate);
  if (now <= due) return 0;

  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const finePerDay = Number(process.env.FINE_PER_DAY) || 2;

  return diffDays * finePerDay;
}

/** Get loan period in days */
export function getLoanPeriodDays(): number {
  return Number(process.env.LOAN_PERIOD_DAYS) || 14;
}

/** Get max renewals allowed */
export function getMaxRenewals(): number {
  return Number(process.env.MAX_RENEWALS) || 2;
}

/** Get max books per user */
export function getMaxBooksPerUser(): number {
  return Number(process.env.MAX_BOOKS_PER_USER) || 5;
}

/** Generate due date from issue date */
export function generateDueDate(issueDate?: Date): Date {
  const date = issueDate ? new Date(issueDate) : new Date();
  date.setDate(date.getDate() + getLoanPeriodDays());
  return date;
}

/** Check if a transaction is overdue */
export function isOverdue(dueDate: Date | string): boolean {
  return new Date() > new Date(dueDate);
}

/** Get days remaining or overdue */
export function getDaysStatus(dueDate: Date | string): {
  days: number;
  isOverdue: boolean;
} {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    days: Math.abs(diffDays),
    isOverdue: diffDays < 0,
  };
}

/** Truncate text with ellipsis */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/** Category color mapping for visual variety */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "Software Engineering": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "Computer Science": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    "Artificial Intelligence": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Mathematics": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "Physics": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    "Literature": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    "History": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
}

/** Status badge color mapping */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    RETURNED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    RECEIVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
}
