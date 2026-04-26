"use client";

// ============================================================
// Member Detail Page
// ============================================================
// Shows member profile (with membership type, phone, address,
// expiry) and full borrow history. Admins can edit contact
// and membership details inline.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getMemberById, updateMemberDetails } from "@/actions/member-actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Shield, User, BookOpen, Phone, MapPin, CreditCard,
  Calendar, Edit2, Loader2,
} from "lucide-react";
import { formatDate, getStatusColor, formatCurrency, getMembershipColor } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [member, setMember] = useState<Awaited<ReturnType<typeof getMemberById>> | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editMembershipType, setEditMembershipType] = useState("STUDENT");
  const [editMembershipExpiry, setEditMembershipExpiry] = useState("");

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

  const openEdit = () => {
    if (!member) return;
    setEditPhone(member.phone ?? "");
    setEditAddress(member.address ?? "");
    setEditMembershipType(member.membershipType ?? "STUDENT");
    setEditMembershipExpiry(
      member.membershipExpiry
        ? new Date(member.membershipExpiry).toISOString().split("T")[0]
        : ""
    );
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!member) return;
    setEditSaving(true);
    try {
      await updateMemberDetails(member.id, {
        phone: editPhone,
        address: editAddress,
        membershipType: editMembershipType,
        membershipExpiry: editMembershipExpiry || undefined,
      });
      toast.success("Member details updated");
      setEditOpen(false);
      fetchMember();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setEditSaving(false);
    }
  };

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

  const activeLoans = member.transactions.filter(
    (t) => t.status === "ACTIVE" || t.status === "OVERDUE"
  );
  const pastLoans = member.transactions.filter((t) => t.status === "RETURNED");

  const isExpired =
    member.membershipExpiry && new Date(member.membershipExpiry) < new Date();

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

      {/* ── Profile Card ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.email}</p>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                    {member.role === "admin"
                      ? <Shield className="w-3 h-3 mr-1" />
                      : <User className="w-3 h-3 mr-1" />}
                    {member.role.toUpperCase()}
                  </Badge>

                  <Badge className={getMembershipColor(member.membershipType ?? "STUDENT")} variant="outline">
                    <CreditCard className="w-3 h-3 mr-1" />
                    {member.membershipType ?? "STUDENT"}
                  </Badge>

                  {isExpired && (
                    <Badge variant="destructive">MEMBERSHIP EXPIRED</Badge>
                  )}

                  {member.banned && (
                    <Badge variant="destructive">BANNED</Badge>
                  )}
                </div>

                {/* Contact / Membership details row */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {member.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {member.phone}
                    </div>
                  )}
                  {member.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {member.address}
                    </div>
                  )}
                  {member.membershipExpiry && (
                    <div className={`flex items-center gap-2 ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      Membership expires {formatDate(member.membershipExpiry)}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    Member since {formatDate(member.createdAt)}
                  </div>
                </div>
              </div>

              {/* Edit button */}
              <Button variant="outline" size="sm" onClick={openEdit} className="shrink-0">
                <Edit2 className="h-4 w-4 mr-1" />
                Edit Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Active Loans ───────────────────────────────────── */}
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

      {/* ── Borrow History ─────────────────────────────────── */}
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
                      <TableCell className="text-muted-foreground">
                        {t.returnDate ? formatDate(t.returnDate) : "—"}
                      </TableCell>
                      <TableCell>
                        {t.fineAmount > 0 ? formatCurrency(t.fineAmount) : "—"}
                      </TableCell>
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

      {/* ── Edit Membership Dialog ─────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Membership Type</Label>
              <Select value={editMembershipType} onValueChange={setEditMembershipType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="FACULTY">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Membership Expiry Date</Label>
              <Input
                type="date"
                value={editMembershipExpiry}
                onChange={(e) => setEditMembershipExpiry(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+91 98765 43210"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="City, State"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={editSaving}>
              {editSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
