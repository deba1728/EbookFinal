import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-linear-to-br from-background via-primary/5 to-background p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
