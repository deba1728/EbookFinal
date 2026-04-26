"use client";

// ============================================================
// Reports Page (Admin Only)
// ============================================================
// Tabbed interface with Issued, Overdue, Inventory, Purchase
// History, and Damaged/Lost reports. Each tab has CSV export.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  getIssuedBooksReport,
  getOverdueReport,
  getInventoryReport,
  getPurchaseReport,
  getDamagedLostReport,
} from "@/actions/report-actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BookOpen, AlertTriangle, Package, ShoppingCart, Loader2, Download, PackageX,
} from "lucide-react";
import {
  formatDate, formatCurrency, getStatusColor, getCategoryColor,
  getConditionColor, exportToCSV,
} from "@/lib/utils";
import { toast } from "sonner";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("issued");
  const [loading, setLoading] = useState(false);

  const [issuedData, setIssuedData] = useState<Awaited<ReturnType<typeof getIssuedBooksReport>>>([]);
  const [overdueData, setOverdueData] = useState<Awaited<ReturnType<typeof getOverdueReport>>>([]);
  const [inventoryData, setInventoryData] = useState<Awaited<ReturnType<typeof getInventoryReport>> | null>(null);
  const [purchaseData, setPurchaseData] = useState<Awaited<ReturnType<typeof getPurchaseReport>> | null>(null);
  const [damagedData, setDamagedData] = useState<Awaited<ReturnType<typeof getDamagedLostReport>>>([]);

  const fetchReport = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case "issued":
          setIssuedData(await getIssuedBooksReport());
          break;
        case "overdue":
          setOverdueData(await getOverdueReport());
          break;
        case "inventory":
          setInventoryData(await getInventoryReport());
          break;
        case "purchases":
          setPurchaseData(await getPurchaseReport());
          break;
        case "damaged":
          setDamagedData(await getDamagedLostReport());
          break;
      }
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  // CSV export helpers
  const exportIssued = () => {
    exportToCSV(
      issuedData.map((t) => ({
        Book: t.book.title,
        Author: t.book.author,
        ISBN: t.book.isbn,
        Category: t.book.category,
        Member: t.user.name,
        Email: t.user.email,
        "Issue Date": formatDate(t.issueDate),
      })),
      "issued_books_report"
    );
  };

  const exportOverdue = () => {
    exportToCSV(
      overdueData.map((t) => ({
        Book: t.book.title,
        Author: t.book.author,
        ISBN: t.book.isbn,
        Member: t.user.name,
        Email: t.user.email,
        "Due Date": formatDate(t.dueDate),
        "Fine (₹)": t.calculatedFine,
      })),
      "overdue_books_report"
    );
  };

  const exportInventory = () => {
    if (!inventoryData) return;
    exportToCSV(
      inventoryData.books.map((b) => ({
        Title: b.title,
        Author: b.author,
        ISBN: b.isbn,
        Category: b.category,
        Available: b.availableCopies,
        Total: b.totalCopies,
        Location: b.location ?? "",
      })),
      "inventory_report"
    );
  };

  const exportPurchases = () => {
    if (!purchaseData) return;
    exportToCSV(
      purchaseData.purchases.map((p) => ({
        Vendor: p.vendor.name,
        "Order Date": formatDate(p.orderDate),
        "Invoice No": p.invoiceNumber ?? "",
        Items: p.items.length,
        "Total (₹)": p.totalAmount,
        Status: p.status,
      })),
      "purchase_history_report"
    );
  };

  const exportDamaged = () => {
    exportToCSV(
      damagedData.map((t) => ({
        Book: t.book.title,
        Author: t.book.author,
        ISBN: t.book.isbn,
        Category: t.book.category,
        Member: t.user.name,
        Email: t.user.email,
        Condition: t.condition,
        Notes: t.conditionNotes ?? "",
        "Fine (₹)": t.fineAmount,
        "Return Date": t.returnDate ? formatDate(t.returnDate) : "",
      })),
      "damaged_lost_report"
    );
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-16">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  const ExportBtn = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled}>
      <Download className="h-3.5 w-3.5 mr-1" />
      Export CSV
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Library analytics and reporting" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="issued" className="text-xs sm:text-sm">
            <BookOpen className="h-4 w-4 mr-1 hidden sm:block" /> Issued
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 mr-1 hidden sm:block" /> Overdue
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm">
            <Package className="h-4 w-4 mr-1 hidden sm:block" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="purchases" className="text-xs sm:text-sm">
            <ShoppingCart className="h-4 w-4 mr-1 hidden sm:block" /> Purchases
          </TabsTrigger>
          <TabsTrigger value="damaged" className="text-xs sm:text-sm">
            <PackageX className="h-4 w-4 mr-1 hidden sm:block" /> Damaged
          </TabsTrigger>
        </TabsList>

        {/* ── Issued Books ─────────────────────────────────── */}
        <TabsContent value="issued">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Issued Books Report</CardTitle>
              <ExportBtn onClick={exportIssued} disabled={loading || issuedData.length === 0} />
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <LoadingSpinner /> : issuedData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No issued books found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Issue Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuedData.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.book.title}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className={getCategoryColor(t.book.category)} variant="outline">
                            {t.book.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{t.user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(t.issueDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Overdue ──────────────────────────────────────── */}
        <TabsContent value="overdue">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-red-500">Overdue Books ({overdueData.length})</CardTitle>
              <ExportBtn onClick={exportOverdue} disabled={loading || overdueData.length === 0} />
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <LoadingSpinner /> : overdueData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No overdue books — great job!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Fine</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueData.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.book.title}</TableCell>
                        <TableCell className="text-muted-foreground">{t.user.name}</TableCell>
                        <TableCell className="text-red-500">{formatDate(t.dueDate)}</TableCell>
                        <TableCell className="font-medium text-red-500">
                          {formatCurrency(t.calculatedFine)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inventory ─────────────────────────────────────── */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Report</CardTitle>
              <ExportBtn
                onClick={exportInventory}
                disabled={loading || !inventoryData || inventoryData.books.length === 0}
              />
            </CardHeader>
            <CardContent>
              {loading || !inventoryData ? <LoadingSpinner /> : (
                <div className="space-y-6">
                  {/* Category Summary */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(inventoryData.byCategory).map(([cat, data]) => (
                      <motion.div
                        key={cat}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card className="bg-muted/30">
                          <CardContent className="p-4">
                            <Badge className={getCategoryColor(cat)} variant="outline">{cat}</Badge>
                            <div className="mt-3 flex justify-between items-end">
                              <div>
                                <p className="text-2xl font-bold">{data.available}</p>
                                <p className="text-xs text-muted-foreground">
                                  available of {data.total}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">{data.books.length} titles</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Full Inventory Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>ISBN</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Available</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryData.books.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.title}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{b.isbn}</TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(b.category)} variant="outline">
                              {b.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={
                              b.availableCopies === 0
                                ? "text-red-500 font-medium"
                                : "text-green-600 dark:text-green-400 font-medium"
                            }>
                              {b.availableCopies}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{b.totalCopies}</TableCell>
                          <TableCell className="text-muted-foreground">{b.location || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Purchase History ──────────────────────────────── */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Purchase History</CardTitle>
                {purchaseData && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Total spent:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(purchaseData.totalSpent)}
                    </span>
                  </p>
                )}
              </div>
              <ExportBtn
                onClick={exportPurchases}
                disabled={loading || !purchaseData || purchaseData.purchases.length === 0}
              />
            </CardHeader>
            <CardContent className="p-0">
              {loading || !purchaseData ? <LoadingSpinner /> : purchaseData.purchases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No purchase history</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseData.purchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.vendor.name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(p.orderDate)}</TableCell>
                        <TableCell>{p.items.length} items</TableCell>
                        <TableCell className="font-medium">{formatCurrency(p.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(p.status)} variant="outline">{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Damaged / Lost ─────────────────────────────────── */}
        <TabsContent value="damaged">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PackageX className="h-5 w-5 text-orange-500" />
                  Damaged &amp; Lost Books
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {damagedData.length} incident{damagedData.length !== 1 ? "s" : ""} recorded
                </p>
              </div>
              <ExportBtn onClick={exportDamaged} disabled={loading || damagedData.length === 0} />
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <LoadingSpinner /> : damagedData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PackageX className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No damaged or lost books recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="hidden lg:table-cell">Notes</TableHead>
                      <TableHead>Fine</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {damagedData.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <p className="font-medium">{t.book.title}</p>
                          <p className="text-xs text-muted-foreground">{t.book.isbn}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className={getCategoryColor(t.book.category)} variant="outline">
                            {t.book.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{t.user.name}</TableCell>
                        <TableCell>
                          <Badge className={getConditionColor(t.condition)} variant="outline">
                            {t.condition}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                          {t.conditionNotes || "—"}
                        </TableCell>
                        <TableCell className="font-medium text-red-500">
                          {t.fineAmount > 0 ? formatCurrency(t.fineAmount) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.returnDate ? formatDate(t.returnDate) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
