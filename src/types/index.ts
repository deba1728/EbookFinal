// ============================================================
// Shared TypeScript Types
// ============================================================

export type UserRole = "admin" | "user";

export type TransactionStatus = "ACTIVE" | "RETURNED" | "OVERDUE";
export type TransactionType = "ISSUE" | "RETURN" | "RENEWAL";
export type PurchaseStatus = "PENDING" | "RECEIVED" | "CANCELLED";
export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type NotificationType =
  | "REGISTRATION_APPROVED"
  | "REGISTRATION_REJECTED"
  | "BOOK_ISSUED"
  | "BOOK_RETURNED"
  | "BOOK_RENEWED"
  | "DUE_REMINDER"
  | "OVERDUE_ALERT"
  | "GENERAL";

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeIssues: number;
  overdueBooks: number;
  totalFinesCollected: number;
  availableBooks: number;
}

export interface BookWithTransactions {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string | null;
  category: string;
  subject: string | null;
  description: string | null;
  coverImage: string | null;
  totalCopies: number;
  availableCopies: number;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  transactions: TransactionWithDetails[];
}

export interface TransactionWithDetails {
  id: string;
  bookId: string;
  userId: string;
  type: string;
  issueDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  renewCount: number;
  fineAmount: number;
  finePaid: boolean;
  status: string;
  createdAt: Date;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PurchaseWithDetails {
  id: string;
  vendorId: string;
  orderDate: Date;
  invoiceNumber: string | null;
  totalAmount: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  vendor: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    title: string;
    isbn: string | null;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  status: RegistrationStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

