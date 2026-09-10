/**
 * lib/auth.ts
 * 
 * NextAuth configuration for Pinnacle Distributing.
 * - CredentialsProvider validating against SQLite prisma.user using bcryptjs
 * - JWT session strategy
 * - JWT & Session callbacks propagating user.id, user.email, user.role ('ADMIN' | 'CUSTOMER')
 */

import type { NextAuthOptions, DefaultSession } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/security";

export const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  "pinnacle_distributing_secure_random_jwt_secret_m1_token_32chars";

export type UserRole = "ADMIN" | "MARKETING" | "CUSTOMER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole | string;
      allowCredit?: boolean;
      allowPickup?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    allowCredit?: boolean;
    allowPickup?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    allowCredit?: boolean;
    allowPickup?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@pinnacle.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await comparePassword(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name || "",
          email: user.email,
          role: user.role || "CUSTOMER",
          allowCredit: user.allowCredit ?? false,
          allowPickup: user.allowPickup ?? false,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as any).role || "CUSTOMER";
        token.allowCredit = (user as any).allowCredit ?? false;
        token.allowPickup = (user as any).allowPickup ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        if (token.email) session.user.email = token.email as string;
        session.user.role = ((token.role as string) || "CUSTOMER") as UserRole;
        session.user.allowCredit = (token.allowCredit as boolean) ?? false;
        session.user.allowPickup = (token.allowPickup as boolean) ?? false;
      }
      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}
