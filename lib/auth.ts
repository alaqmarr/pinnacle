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

import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

export async function getAuthSession() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).id) {
      return session;
    }
  } catch {
    // Continue to cookie-based extraction
  }

  try {
    const cookieStore = await cookies();
    let token =
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value;

    if (!token && cookieStore) {
      const hasCookie = (name: string) =>
        typeof cookieStore.has === "function"
          ? cookieStore.has(name)
          : Boolean(cookieStore.get(name));

      const isSecure = Boolean(cookieStore.get("__Secure-next-auth.session-token.0"));
      const baseName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
      if (hasCookie(`${baseName}.0`)) {
        let full = "";
        let i = 0;
        while (hasCookie(`${baseName}.${i}`)) {
          full += cookieStore.get(`${baseName}.${i}`)?.value || "";
          i++;
        }
        token = full || undefined;
      }
    }

    if (!token) return null;

    try {
      token = decodeURIComponent(token);
    } catch {
      // Keep as-is
    }

    const decoded = await decode({ token, secret: NEXTAUTH_SECRET });
    if (!decoded || !decoded.email) return null;

    const id = (decoded.id as string) || (decoded.sub as string) || "";
    if (!id) return null;

    return {
      user: {
        id,
        name: (decoded.name as string) || "",
        email: decoded.email as string,
        role: ((decoded.role as string) || "CUSTOMER") as UserRole,
        allowCredit: Boolean(decoded.allowCredit),
        allowPickup: Boolean(decoded.allowPickup),
      },
    };
  } catch (err) {
    return null;
  }
}
