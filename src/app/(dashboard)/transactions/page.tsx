"use client";

// ============================================================
// Transactions Page
// ============================================================
// Lists all transactions with status filtering.
// Users see their own; admins see all.
// Admins can return, renew, and mark fines as paid.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getTransactions, returnBook, renewBook, payFine } from "@/actions/transaction-actions";
import { useSession } from "@/lib/auth-client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Search, ArrowLeftRight, RotateCcw, CheckCircle, IndianRupee, Loader2,
} from "lucide-react";
import { formatDate, getStatusColor, formatCurrency, getDaysStatus } from "@/lib/utils";
import { toast } from "sonner";

interface TransactionData {
  id: string;
  type: string;
  issueDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  renewCount: number;
  fineAmount: number;
  finePaid: boolean;
  status: string;
  book: { id: string; title: string; author: string; isbn: string };
  user: { id: string; name: string; email: string };
}

export default function TransactionsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [returnDialog, setReturnDialog] = useState<TransactionData | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTransactions({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
      });
      setTransactions(result.transactions);
      setTotalPages(result.totalPages);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleReturn = async () => {
    if (!returnDialog) return;
    setActionLoading(returnDialog.id);
    try {
      const result = await returnBook(returnDialog.id);
      if (result.fine && result.fine > 0) {
        toast.warning(`Book returned with a fine of ${formatCurrency(result.fine)}`);
      } else {
        toast.success("Book returned successfully!");
      }
      setReturnDialog(null);
      fetchTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to return book");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = async (id: string) => {
    setActionLoading(id);
    try {
      await renewBook(id);
      toast.success("Book renewed successfully!");
      fetchTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to renew");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayFine = async (id: string) => {
    setActionLoading(id);
    try {
      await payFine(id);
      toast.success("Fine marked as paid");
      fetchTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark fine as paid");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description={isAdmin ? "Manage all book transactions" : "View your borrowing history"}>
        {isAdmin && (
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="h-4 w-4" />
              Issue Book
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by book or member..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No transactions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    {isAdmin && <TableHead className="hidden md:table-cell">Member</TableHead>}
                    <TableHead className="hidden sm:table-cell">Issued</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fine</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t, index) => {
                    const daysStatus = t.status === "ACTIVE" ? getDaysStatus(t.dueDate) : null;
                    return (
                      <motion.tr key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }} className="border-b transition-colors hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{t.book.title}</p>
                            <p className="text-xs text-muted-foreground">{t.book.isbn}</p>
                          </div>
                        </TableCell>
                        {isAdmin && <TableCell className="hidden md:table-cell text-muted-foreground">{t.user.name}</TableCell>}
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(t.issueDate)}</TableCell>
                        <TableCell>
                          <div>
                            <p>{formatDate(t.dueDate)}</p>
                            {daysStatus && (
                              <p className={`text-xs ${daysStatus.isOverdue ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                                {daysStatus.isOverdue ? `${daysStatus.days}d overdue` : `${daysStatus.days}d remaining`}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(t.status)} variant="outline">{t.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {t.fineAmount > 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="text-red-500 font-medium">{formatCurrency(t.fineAmount)}</span>
                              {t.finePaid && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                            </div>
                          ) : "—"}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {(t.status === "ACTIVE" || t.status === "OVERDUE") && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => setReturnDialog(t)}
                                    disabled={actionLoading === t.id}>
                                    {actionLoading === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                                    Return
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleRenew(t.id)}
                                    disabled={actionLoading === t.id || t.renewCount >= 2}>
                                    Renew
                                  </Button>
                                </>
                              )}
                              {t.fineAmount > 0 && !t.finePaid && (
                                <Button variant="ghost" size="sm" onClick={() => handlePayFine(t.id)}
                                  disabled={actionLoading === t.id}>
                                  <IndianRupee className="h-3 w-3" /> Pay
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Return Confirmation Dialog */}
      <Dialog open={!!returnDialog} onOpenChange={() => setReturnDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>
              Return &quot;{returnDialog?.book.title}&quot; from {returnDialog?.user.name}?
              {returnDialog && getDaysStatus(returnDialog.dueDate).isOverdue && (
                <span className="block mt-2 text-red-500 font-medium">
                  This book is overdue. A fine will be calculated automatically.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialog(null)}>Cancel</Button>
            <Button onClick={handleReturn} disabled={!!actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
