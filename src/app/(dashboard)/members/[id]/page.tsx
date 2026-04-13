"use client";

// ============================================================
// Member Detail Page
// ============================================================
// Shows member profile and full borrow history timeline.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getMemberById } from "@/actions/member-actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Shield, User, BookOpen } from "lucide-react";
import { formatDate, getStatusColor, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [member, setMember] = useState<Awaited<ReturnType<typeof getMemberById>> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMember = useCallback(async () => {
    try {
      const data = await getMemberById(params.id as string);
      setMember(data);
    } catch {
      toast.error("Member not found");
      router.push("/members");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  if (loading || !member) {
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

  const activeLoans = member.transactions.filter((t) => t.status === "ACTIVE" || t.status === "OVERDUE");
  const pastLoans = member.transactions.filter((t) => t.status === "RETURNED");

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={member.name} description={member.email}>
        <Button variant="outline" asChild>
          <Link href="/members">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                    {member.role === "admin" ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                    {member.role.toUpperCase()}
                  </Badge>
                  {member.banned && (
                    <Badge variant="destructive">BANNED</Badge>
                  )}
                </div>
              </div>
              <div className="ml-auto text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium">{formatDate(member.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Active Loans ({activeLoans.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLoans.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.book.title}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(t.issueDate)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(t.dueDate)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(t.status)} variant="outline">{t.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Borrow History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Borrow History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pastLoans.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No past transactions</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastLoans.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.book.title}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(t.issueDate)}</TableCell>
                      <TableCell className="text-muted-foreground">{t.returnDate ? formatDate(t.returnDate) : "—"}</TableCell>
                      <TableCell>{t.fineAmount > 0 ? formatCurrency(t.fineAmount) : "—"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(t.status)} variant="outline">{t.status}</Badge>
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
