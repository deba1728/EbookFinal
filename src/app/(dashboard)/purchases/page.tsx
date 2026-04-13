"use client";

// ============================================================
// Purchases Page (Admin Only)
// ============================================================
// Purchase order management with vendor info and status tracking.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getPurchases, receivePurchase, cancelPurchase } from "@/actions/purchase-actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, ShoppingCart, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Awaited<ReturnType<typeof getPurchases>>["purchases"]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPurchases({ status: statusFilter || undefined, page });
      setPurchases(result.purchases);
      setTotalPages(result.totalPages);
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const handleReceive = async (id: string) => {
    setActionLoading(id);
    try {
      await receivePurchase(id);
      toast.success("Purchase received and stock updated!");
      fetchPurchases();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to receive purchase");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await cancelPurchase(id);
      toast.success("Purchase cancelled");
      fetchPurchases();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Purchases" description="Manage book purchase orders and vendor invoices">
        <Button asChild>
          <Link href="/purchases/new">
            <Plus className="h-4 w-4" />
            New Purchase
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="RECEIVED">Received</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
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
            ) : purchases.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No purchases found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p, index) => (
                    <motion.tr key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }} className="border-b hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">{p.invoiceNumber || "—"}</TableCell>
                      <TableCell className="font-medium">{p.vendor.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(p.orderDate)}</TableCell>
                      <TableCell>{p.items.length} items</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(p.status)} variant="outline">{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "PENDING" && (
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => handleReceive(p.id)}
                              disabled={actionLoading === p.id}>
                              {actionLoading === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              Receive
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancel(p.id)}
                              disabled={actionLoading === p.id}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
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
    </div>
  );
}
