"use client";

// ============================================================
// Issue Book Page (Admin Only)
// ============================================================
// Form to issue a book to a member.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { issueBook } from "@/actions/transaction-actions";
import { getBooks } from "@/actions/book-actions";
import { getAllUsers } from "@/actions/member-actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function IssueBookPage() {
  const router = useRouter();
  const [bookId, setBookId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<{ id: string; title: string; isbn: string; availableCopies: number }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [booksResult, usersResult] = await Promise.all([
          getBooks({ limit: 100 }),
          getAllUsers(),
        ]);
        setBooks(booksResult.books.filter((b) => b.availableCopies > 0));
        setUsers(usersResult);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId || !userId) {
      toast.error("Please select both a book and a member");
      return;
    }

    setLoading(true);
    try {
      await issueBook(bookId, userId);
      toast.success("Book issued successfully!");
      router.push("/transactions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to issue book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Issue Book" description="Issue a book to a library member">
        <Button variant="outline" asChild>
          <Link href="/transactions">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Issue Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="flex items-center justify-center py-10">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Book *</Label>
                  <Select value={bookId} onValueChange={setBookId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a book..." />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} ({book.availableCopies} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Member *</Label>
                  <Select value={userId} onValueChange={setUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-none bg-muted/50 p-3 text-sm text-muted-foreground">
                  <p>• Loan period: <span className="font-medium text-foreground">14 days</span></p>
                  <p>• Max renewals: <span className="font-medium text-foreground">2 times</span></p>
                  <p>• Fine rate: <span className="font-medium text-foreground">₹2/day</span> after due date</p>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Issuing...</> : "Issue Book"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
