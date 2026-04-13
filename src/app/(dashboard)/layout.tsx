import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check — redirect to sign-in if not authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = {
    name: session.user.name || "",
    email: session.user.email,
    role: (session.user as Record<string, unknown>).role as string || "user",
  };

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
