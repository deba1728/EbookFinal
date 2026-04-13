"use client";

// ============================================================
// Settings Page
// ============================================================
// View and update profile information.
// ============================================================

import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, User, Mail, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="Manage your account settings" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar & name */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-none bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "?"}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user?.name || "User"}</h3>
                <Badge
                  variant={user?.role === "admin" ? "default" : "secondary"}
                  className="mt-1"
                >
                  {user?.role === "admin" ? (
                    <Shield className="w-3 h-3 mr-1" />
                  ) : (
                    <User className="w-3 h-3 mr-1" />
                  )}
                  {(user?.role || "user").toUpperCase()}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member since</p>
                  <p className="font-medium">
                    {user?.createdAt ? formatDate(user.createdAt) : "—"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Library config info */}
            <div>
              <h4 className="font-medium mb-3">Library Policies</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between rounded-none bg-muted/30 p-3">
                  <span className="text-muted-foreground">Loan Period</span>
                  <span className="font-medium">14 days</span>
                </div>
                <div className="flex justify-between rounded-none bg-muted/30 p-3">
                  <span className="text-muted-foreground">Max Renewals</span>
                  <span className="font-medium">2 times</span>
                </div>
                <div className="flex justify-between rounded-none bg-muted/30 p-3">
                  <span className="text-muted-foreground">Max Active Loans</span>
                  <span className="font-medium">5 books</span>
                </div>
                <div className="flex justify-between rounded-none bg-muted/30 p-3">
                  <span className="text-muted-foreground">Overdue Fine</span>
                  <span className="font-medium">₹2/day</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
