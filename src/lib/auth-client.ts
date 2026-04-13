// ============================================================
// Better Auth — Client Configuration
// ============================================================
// Client-side auth instance for use in React components.
// Provides hooks: useSession, signIn, signUp, signOut.
// ============================================================

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    adminClient({
      ac,
      roles,
      adminRole: ["admin"],
    }),
  ],
});

// Export convenience methods
export const { signIn, signUp, signOut, useSession } = authClient;
