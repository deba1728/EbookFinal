"use client";

// ============================================================
// Book Detail Page
// ============================================================
// Shows book info, stock status, and transaction history.
// Admins can edit fields inline and view full history.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getBookById, updateBook } from "@/actions/book-actions";
import { useSession } from "@/lib/auth-client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Save, X, Loader2, BookOpen } from "lucide-react";
import { formatDate, getStatusColor, getCategoryColor, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [book, setBook] = useState<Awaited<ReturnType<typeof getBookById>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBook = useCallback(async () => {
    try {
      const data = await getBookById(params.id as string);
      setBook(data);
    } catch {
      toast.error("Book not found");
      router.push("/books");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!book) return;
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("category", book.category);
      await updateBook(book.id, formData);
      toast.success("Book updated successfully!");
      setEditing(false);
      fetchBook();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !book) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={book.title} description={`by ${book.author}`}>
        <Button variant="outline" asChild>
          <Link href="/books">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        {isAdmin && !editing && (
          <Button onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Book Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Book Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Title</Label>
                      <Input name="title" defaultValue={book.title} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Author</Label>
                      <Input name="author" defaultValue={book.author} required />
                    </div>
                    <div className="space-y-2">
                      <Label>ISBN</Label>
                      <Input name="isbn" defaultValue={book.isbn} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Publisher</Label>
                      <Input name="publisher" defaultValue={book.publisher || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input name="category" defaultValue={book.category} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input name="subject" defaultValue={book.subject || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Copies</Label>
                      <Input name="totalCopies" type="number" min="1" defaultValue={book.totalCopies} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input name="location" defaultValue={book.location || ""} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Description</Label>
                      <Input name="description" defaultValue={book.description || ""} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Cover Image URL</Label>
                      <Input name="coverImage" defaultValue={book.coverImage || ""} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-3 text-sm">
                  <InfoRow label="ISBN" value={book.isbn} mono />
                  <InfoRow label="Publisher" value={book.publisher || "—"} />
                  <InfoRow label="Category" value={book.category} badge badgeClass={getCategoryColor(book.category)} />
                  <InfoRow label="Subject" value={book.subject || "—"} />
                  <InfoRow label="Location" value={book.location || "—"} />
                  <InfoRow label="Description" value={book.description || "No description"} />
                  <InfoRow label="Added" value={formatDate(book.createdAt)} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stock Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{book.availableCopies}</p>
                <p className="text-sm text-muted-foreground">of {book.totalCopies} available</p>
              </div>
              <div className="w-full bg-muted h-2">
                <div
                  className="bg-primary h-2 transition-all duration-500"
                  style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {book.totalCopies - book.availableCopies} copies currently issued
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {book.transactions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No transactions yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {book.transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.user.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(t.issueDate)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(t.dueDate)}</TableCell>
                      <TableCell>{t.fineAmount > 0 ? formatCurrency(t.fineAmount) : "—"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(t.status)} variant="outline">
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  badge,
  badgeClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  badgeClass?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      {badge ? (
        <Badge className={badgeClass} variant="outline">{value}</Badge>
      ) : (
        <span className={mono ? "font-mono text-xs" : "font-medium"}>{value}</span>
      )}
    </div>
  );
}
