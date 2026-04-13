"use client";

// ============================================================
// New Purchase Order Page (Admin Only)
// ============================================================
// Create a purchase order with dynamic line items.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createPurchase, getVendors, createVendor } from "@/actions/purchase-actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Loader2, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface LineItem {
  title: string;
  isbn: string;
  quantity: number;
  unitPrice: number;
}

export default function NewPurchasePage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ title: "", isbn: "", quantity: 1, unitPrice: 0 }]);
  const [loading, setLoading] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);

  useEffect(() => {
    getVendors().then(setVendors).catch(() => {});
  }, []);

  const addItem = () => setItems([...items, { title: "", isbn: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as Record<string, string | number>)[field] = value;
    setItems(updated);
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) { toast.error("Select a vendor"); return; }
    if (items.some((i) => !i.title)) { toast.error("All items need a title"); return; }

    setLoading(true);
    try {
      await createPurchase({ vendorId, invoiceNumber, notes, items });
      toast.success("Purchase order created!");
      router.push("/purchases");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create purchase");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createVendor(formData);
      toast.success("Vendor created!");
      setShowVendorDialog(false);
      const updatedVendors = await getVendors();
      setVendors(updatedVendors);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create vendor");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="New Purchase Order" description="Create a purchase order for books">
        <Button variant="outline" asChild>
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader><CardTitle>Order Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Vendor *</Label>
                  <div className="flex gap-2">
                    <Select value={vendorId} onValueChange={setVendorId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowVendorDialog(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-001" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Purchase notes..." />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="grid gap-3 sm:grid-cols-12 items-end p-3 rounded-none bg-muted/30">
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input value={item.title} onChange={(e) => updateItem(index, "title", e.target.value)} placeholder="Book title" />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">ISBN</Label>
                    <Input value={item.isbn} onChange={(e) => updateItem(index, "isbn", e.target.value)} placeholder="ISBN" />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="sm:col-span-1">
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
              <div className="flex justify-end pt-4 border-t">
                <p className="text-lg font-semibold">Total: {formatCurrency(total)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : "Create Purchase Order"}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* New Vendor Dialog */}
      <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Add Vendor
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateVendor} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input name="name" required placeholder="Vendor name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="vendor@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" placeholder="+1-555-0000" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input name="address" placeholder="Full address" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowVendorDialog(false)}>Cancel</Button>
              <Button type="submit">Add Vendor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
