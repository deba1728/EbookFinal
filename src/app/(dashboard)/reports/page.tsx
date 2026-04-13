"use client";

// ============================================================
// Reports Page (Admin Only)
// ============================================================
// Tabbed interface with Issued, Overdue, Inventory, and
// Purchase History reports.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  getIssuedBooksReport,
  getOverdueReport,
  getInventoryReport,
  getPurchaseReport,
} from "@/actions/report-actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BookOpen, AlertTriangle, Package, ShoppingCart, Loader2,
} from "lucide-react";
import { formatDate, formatCurrency, getStatusColor, getCategoryColor } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("issued");
  const [loading, setLoading] = useState(false);
  const [issuedData, setIssuedData] = useState<Awaited<ReturnType<typeof getIssuedBooksReport>>>([]);
  const [overdueData, setOverdueData] = useState<Awaited<ReturnType<typeof getOverdueReport>>>([]);
  const [inventoryData, setInventoryData] = useState<Awaited<ReturnType<typeof getInventoryReport>> | null>(null);
  const [purchaseData, setPurchaseData] = useState<Awaited<ReturnType<typeof getPurchaseReport>> | null>(null);

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

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-16">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Library analytics and reporting" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
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
        </TabsList>

        {/* Issued Books Report */}
        <TabsContent value="issued">
          <Card>
            <CardHeader>
              <CardTitle>Issued Books Report</CardTitle>
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
                          <Badge className={getCategoryColor(t.book.category)} variant="outline">{t.book.category}</Badge>
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

        {/* Overdue Report */}
        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Overdue Books ({overdueData.length})</CardTitle>
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
                        <TableCell className="font-medium text-red-500">{formatCurrency(t.calculatedFine)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Report */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Report</CardTitle>
            </CardHeader>
            <CardContent>
              {loading || !inventoryData ? <LoadingSpinner /> : (
                <div className="space-y-6">
                  {/* Category Summary */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(inventoryData.byCategory).map(([cat, data]) => (
                      <motion.div key={cat} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <Card className="bg-muted/30">
                          <CardContent className="p-4">
                            <Badge className={getCategoryColor(cat)} variant="outline">{cat}</Badge>
                            <div className="mt-3 flex justify-between items-end">
                              <div>
                                <p className="text-2xl font-bold">{data.available}</p>
                                <p className="text-xs text-muted-foreground">available of {data.total}</p>
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
                            <Badge className={getCategoryColor(b.category)} variant="outline">{b.category}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={b.availableCopies === 0 ? "text-red-500 font-medium" : "text-green-600 dark:text-green-400 font-medium"}>
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

        {/* Purchase History Report */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Purchase History</CardTitle>
                {purchaseData && (
                  <p className="text-sm text-muted-foreground">
                    Total spent: <span className="font-semibold text-foreground">{formatCurrency(purchaseData.totalSpent)}</span>
                  </p>
                )}
              </div>
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
      </Tabs>
    </div>
  );
}
