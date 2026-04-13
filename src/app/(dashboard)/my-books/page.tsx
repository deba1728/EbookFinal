"use client";

// ============================================================
// My Books Page (Student Only)
// ============================================================
// Shows the student's currently borrowed books, due dates,
// renewal options, borrowing history, and fine status.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { getTransactions } from "@/actions/transaction-actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookMarked,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { formatDate, getDaysStatus, formatCurrency, getStatusColor } from "@/lib/utils";

interface TransactionData {
  id: string;
  type: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  renewCount: number;
  fineAmount: number;
  finePaid: boolean;
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

export default function MyBooksPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [filter, setFilter] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTransactions({
        status: filter === "ALL" ? undefined : filter,
        page,
      });
      setTransactions(result.transactions);
      setTotalPages(result.totalPages);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const activeLoans = transactions.filter(
    (t) => t.status === "ACTIVE" || t.status === "OVERDUE"
  );
  const unpaidFines = transactions
    .filter((t) => !t.finePaid && t.fineAmount > 0)
    .reduce((sum, t) => sum + t.fineAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Books"
        description="Track your borrowed books, due dates, and fines"
      />

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 grid-cols-1 sm:grid-cols-3"
      >
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-blue-500/10">
                <BookMarked className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold">{filter === "ACTIVE" ? activeLoans.length : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">
                  {filter === "ACTIVE"
                    ? activeLoans.filter((t) => t.status === "OVERDUE" || getDaysStatus(t.dueDate).isOverdue).length
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-red-500/10">
                <IndianRupee className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unpaid Fines</p>
                <p className="text-2xl font-bold">{formatCurrency(unpaidFines)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(val) => { setFilter(val); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="RETURNED">Returned</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Book cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              />
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16 text-muted-foreground">
              <BookMarked className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No books found</p>
              <p className="text-sm mt-1">
                {filter === "ACTIVE"
                  ? "You don't have any active loans"
                  : "No borrowing history yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction, index) => {
              const daysInfo = getDaysStatus(transaction.dueDate);
              const isActive = transaction.status === "ACTIVE" || transaction.status === "OVERDUE";

              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Book info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {transaction.book.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {transaction.book.author} · ISBN: {transaction.book.isbn}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <Badge className={getStatusColor(transaction.status)} variant="outline">
                              {transaction.status}
                            </Badge>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Issued: {formatDate(transaction.issueDate)}
                            </div>

                            {isActive && (
                              <div
                                className={`flex items-center gap-1 text-xs ${
                                  daysInfo.isOverdue
                                    ? "text-red-500"
                                    : daysInfo.days <= 3
                                    ? "text-amber-500"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {daysInfo.isOverdue ? (
                                  <AlertTriangle className="h-3 w-3" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                                {daysInfo.isOverdue
                                  ? `Overdue by ${daysInfo.days} days`
                                  : `Due in ${daysInfo.days} days`}
                              </div>
                            )}

                            {transaction.returnDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                Returned: {formatDate(transaction.returnDate)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right side info */}
                        <div className="flex items-center gap-3 shrink-0">
                          {transaction.renewCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Renewed {transaction.renewCount}×
                            </span>
                          )}
                          {transaction.fineAmount > 0 && (
                            <Badge
                              variant={transaction.finePaid ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              <IndianRupee className="h-3 w-3 mr-0.5" />
                              {transaction.fineAmount}
                              {transaction.finePaid ? " (Paid)" : " (Unpaid)"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
