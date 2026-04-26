"use client";

// ============================================================
// Transactions Page
// ============================================================
// Lists all transactions with status filtering.
// Users see their own; admins see all.
// Admins can return (with condition), renew, and pay fines.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getTransactions,
  returnBook,
  renewBook,
  payFine,
  markBookCondition,
} from "@/actions/transaction-actions";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, ArrowLeftRight, RotateCcw, CheckCircle, IndianRupee, Loader2,
  AlertTriangle, PackageX,
} from "lucide-react";
import {
  formatDate, getStatusColor, formatCurrency, getDaysStatus, getConditionColor,
} from "@/lib/utils";
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
  condition?: string;
  book: { id: string; title: string; author: string; isbn: string };
  user: { id: string; name: string; email: string };
}

type ReturnStep = "confirm" | "condition";

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

  // Return dialog state
  const [returnDialog, setReturnDialog] = useState<TransactionData | null>(null);
  const [returnStep, setReturnStep] = useState<ReturnStep>("confirm");
  const [returnedId, setReturnedId] = useState<string | null>(null);
  const [condition, setCondition] = useState<"GOOD" | "DAMAGED" | "LOST">("GOOD");
  const [conditionNotes, setConditionNotes] = useState("");

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

  const openReturnDialog = (t: TransactionData) => {
    setReturnDialog(t);
    setReturnStep("confirm");
    setCondition("GOOD");
    setConditionNotes("");
    setReturnedId(null);
  };

  const closeReturnDialog = () => {
    setReturnDialog(null);
    setReturnStep("confirm");
    setReturnedId(null);
    setCondition("GOOD");
    setConditionNotes("");
  };

  // Step 1 — Confirm the return
  const handleReturn = async () => {
    if (!returnDialog) return;
    setActionLoading(returnDialog.id);
    try {
      const result = await returnBook(returnDialog.id);
      setReturnedId(returnDialog.id);
      setReturnStep("condition");
      if (result.fine && result.fine > 0) {
        toast.warning(`Overdue fine: ${formatCurrency(result.fine)}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to return book");
      closeReturnDialog();
    } finally {
      setActionLoading(null);
    }
  };

  // Step 2 — Save condition
  const handleCondition = async () => {
    if (!returnedId) return;
    setActionLoading(returnedId);
    try {
      await markBookCondition(returnedId, condition, conditionNotes || undefined);
      if (condition === "LOST") {
        toast.error("Book marked as LOST. ₹500 replacement fine applied.");
      } else if (condition === "DAMAGED") {
        toast.warning("Book returned as DAMAGED. Logged for inventory.");
      } else {
        toast.success("Book returned successfully!");
      }
      closeReturnDialog();
      fetchTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save condition");
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
      <PageHeader
        title="Transactions"
        description={isAdmin ? "Manage all book transactions" : "View your borrowing history"}
      >
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
              <Input
                placeholder="Search by book or member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}
            >
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
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                />
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
                    <TableHead>Condition</TableHead>
                    <TableHead>Fine</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t, index) => {
                    const daysStatus = t.status === "ACTIVE" ? getDaysStatus(t.dueDate) : null;
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{t.book.title}</p>
                            <p className="text-xs text-muted-foreground">{t.book.isbn}</p>
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {t.user.name}
                          </TableCell>
                        )}
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {formatDate(t.issueDate)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{formatDate(t.dueDate)}</p>
                            {daysStatus && (
                              <p className={`text-xs ${daysStatus.isOverdue ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                                {daysStatus.isOverdue
                                  ? `${daysStatus.days}d overdue`
                                  : `${daysStatus.days}d remaining`}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(t.status)} variant="outline">
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t.condition && t.condition !== "GOOD" ? (
                            <Badge className={getConditionColor(t.condition)} variant="outline">
                              {t.condition}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openReturnDialog(t)}
                                    disabled={actionLoading === t.id}
                                  >
                                    {actionLoading === t.id
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <RotateCcw className="h-3 w-3" />}
                                    Return
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRenew(t.id)}
                                    disabled={actionLoading === t.id || t.renewCount >= 2}
                                  >
                                    Renew
                                  </Button>
                                </>
                              )}
                              {t.fineAmount > 0 && !t.finePaid && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePayFine(t.id)}
                                  disabled={actionLoading === t.id}
                                >
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
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
        </Card>
      </motion.div>

      {/* ── Return Dialog — Step 1: Confirm ─────────────────── */}
      <Dialog open={!!returnDialog && returnStep === "confirm"} onOpenChange={closeReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>
              Return &quot;{returnDialog?.book.title}&quot; from {returnDialog?.user.name}?
              {returnDialog && getDaysStatus(returnDialog.dueDate).isOverdue && (
                <span className="flex items-center gap-1 mt-2 text-red-500 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  This book is overdue. A fine will be calculated automatically.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeReturnDialog}>Cancel</Button>
            <Button onClick={handleReturn} disabled={!!actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Return Dialog — Step 2: Condition ───────────────── */}
      <Dialog open={returnStep === "condition"} onOpenChange={closeReturnDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageX className="h-5 w-5 text-muted-foreground" />
              Book Condition
            </DialogTitle>
            <DialogDescription>
              What is the condition of the returned book? This updates inventory tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Condition selector */}
            <div className="space-y-2">
              <Label>Condition</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["GOOD", "DAMAGED", "LOST"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={`py-2 px-3 rounded-none border text-sm font-medium transition-colors ${
                      condition === c
                        ? c === "GOOD"
                          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : c === "DAMAGED"
                          ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                          : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning for LOST */}
            {condition === "LOST" && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-none bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Marking as LOST will deduct one copy from total inventory and apply a
                  <strong> ₹500 replacement fine</strong>.
                </span>
              </motion.div>
            )}

            {/* Notes */}
            {(condition === "DAMAGED" || condition === "LOST") && (
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder={
                    condition === "DAMAGED"
                      ? "Describe the damage (e.g. torn pages, water damage)"
                      : "Describe the circumstances of loss"
                  }
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeReturnDialog}>Skip</Button>
            <Button
              onClick={handleCondition}
              disabled={!!actionLoading}
              variant={condition === "LOST" ? "destructive" : "default"}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Condition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
