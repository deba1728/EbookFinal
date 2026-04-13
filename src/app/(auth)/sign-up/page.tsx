"use client";

// ============================================================
// Sign Up Page — Registration Request
// ============================================================
// Students submit a registration request. They cannot login
// until an admin approves the request.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { submitRegistrationRequest } from "@/actions/registration-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Library, Loader2, Eye, EyeOff, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await submitRegistrationRequest({ name, email, password });
      setSubmitted(true);
      toast.success("Registration request submitted!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success State — Request Submitted ──────────────────────
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass border-border/40">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto flex items-center justify-center w-16 h-16 rounded-none bg-emerald-500/10"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold">Request Submitted!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Your registration request has been sent to the librarian for review.
              </p>
            </div>

            <div className="rounded-none bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Pending Approval</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You will be able to sign in once an administrator approves your request.
              </p>
            </div>

            <Link
              href="/sign-in"
              className="text-primary text-sm font-medium hover:underline inline-block"
            >
              ← Back to Sign In
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Registration Form ──────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md relative z-10"
    >
      <Card className="glass border-border/40">
        <CardHeader className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto flex items-center justify-center w-12 h-12 rounded-none bg-primary text-primary-foreground shadow-lg glow"
          >
            <Library className="w-6 h-6" />
          </motion.div>
          <div>
            <CardTitle className="text-2xl font-bold">Request Access</CardTitle>
            <CardDescription className="mt-1">
              Submit a registration request for LibraryOS
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-8"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="space-y-2"
            >
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-8 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            {/* Info notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="rounded-none bg-muted/40 p-3 text-xs text-muted-foreground"
            >
              <p>
                <strong>Note:</strong> Your registration request will be reviewed by a librarian.
                You&apos;ll be able to sign in after approval.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full h-10 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting request...
                  </>
                ) : (
                  "Submit Registration Request"
                )}
              </Button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
