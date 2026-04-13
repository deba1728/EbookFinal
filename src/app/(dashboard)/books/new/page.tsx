"use client";

// ============================================================
// Add New Book Page
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createBook } from "@/actions/book-actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const CATEGORIES = [
  "Software Engineering",
  "Computer Science",
  "Artificial Intelligence",
  "Mathematics",
  "Physics",
  "Literature",
  "History",
  "Other",
];

export default function NewBookPage() {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("category", category);
      await createBook(formData);
      toast.success("Book created successfully!");
      router.push("/books");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Add New Book" description="Add a book to the library catalog">
        <Button variant="outline" asChild>
          <Link href="/books">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" placeholder="Book title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input id="author" name="author" placeholder="Author name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN *</Label>
                  <Input id="isbn" name="isbn" placeholder="978-0000000000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input id="publisher" name="publisher" placeholder="Publisher name" />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" placeholder="Subject area" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalCopies">Total Copies *</Label>
                  <Input id="totalCopies" name="totalCopies" type="number" min="1" defaultValue="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Shelf Location</Label>
                  <Input id="location" name="location" placeholder="e.g., Shelf A1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Brief description of the book" rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input id="coverImage" name="coverImage" type="url" placeholder="https://..." />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Save Book</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
