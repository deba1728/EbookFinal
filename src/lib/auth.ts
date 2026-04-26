// ============================================================
// Better Auth — Server Configuration
// ============================================================
// Configures Better Auth with Prisma adapter, email/password
// auth, admin plugin for RBAC, and auto-promotes first user.
// ============================================================

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { ac, roles } from "./permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // Prevent session creation on signUpEmail (admin approval path)
  },

  plugins: [
    admin({
      ac,
      roles,
      defaultRole: "user",
      adminRole: ["admin"],
    }),
    nextCookies(),
  ],

  session: {
    // Sessions expire after 7 days
    expiresIn: 60 * 60 * 24 * 7,
    // Refresh sessions that are within 1 day of expiry
    updateAge: 60 * 60 * 24,
  },

  // Auto-promote the first user to admin
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
      approvalStatus: {
        type: "string",
        defaultValue: "APPROVED",
      },
    },
  },

  // Hook: auto-promote first user to admin, and block unapproved users
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const userCount = await prisma.user.count();
          if (userCount === 0) {
            return {
              data: {
                ...user,
                role: "admin",
                approvalStatus: "APPROVED",
              },
            };
          }
          return { data: user };
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
          });
          
          if (!user) {
            throw new Error("User not found");
          }
          
          if (user.approvalStatus === "PENDING") {
            throw new Error("Your account is pending admin approval. Please wait.");
          }
          if (user.approvalStatus === "REJECTED") {
            throw new Error("Your registration has been rejected. Contact the librarian.");
          }
          
          return { data: session };
        },
      },
    },
  },
});

// Export type for use in server components
export type Session = typeof auth.$Infer.Session;
