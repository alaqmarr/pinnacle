/**
 * app/api/auth/[...nextauth]/route.ts
 * 
 * NextAuth route handler for Next.js App Router.
 * Supports standard NextAuth workflows as well as direct JSON API authentication.
 */

import NextAuth from "next-auth";
import { authOptions, NEXTAUTH_SECRET } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { encode, decode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/security";
import crypto from "crypto";

const nextAuthHandler = NextAuth(authOptions);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const resolvedParams = await context.params;
  const pathSegments = resolvedParams?.nextauth || [];
  const action = pathSegments[0];

  // 1. /api/auth/providers
  if (action === "providers") {
    return NextResponse.json({
      credentials: {
        id: "credentials",
        name: "Credentials",
        type: "credentials",
      },
    });
  }

  // 2. /api/auth/csrf
  if (action === "csrf") {
    const existingCsrf = req.cookies.get("next-auth.csrf-token")?.value;
    const csrfToken = existingCsrf
      ? existingCsrf.split("|")[0]
      : crypto.randomBytes(32).toString("hex");
    const response = NextResponse.json({ csrfToken });
    if (!existingCsrf) {
      response.cookies.set(
        "next-auth.csrf-token",
        `${csrfToken}|${crypto.randomBytes(32).toString("hex")}`,
        {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        }
      );
    }
    return response;
  }

  // 3. /api/auth/session
  if (action === "session") {
    const sessionCookie =
      req.cookies.get("next-auth.session-token")?.value ||
      req.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }

    try {
      const decoded = await decode({
        token: sessionCookie,
        secret: NEXTAUTH_SECRET,
      });

      if (!decoded || !decoded.email) {
        return NextResponse.json({ user: null });
      }

      return NextResponse.json({
        user: {
          id: decoded.id as string,
          name: (decoded.name as string) || "",
          email: decoded.email as string,
          role: (decoded.role as string) || "CUSTOMER",
          allowCredit: Boolean(decoded.allowCredit),
          allowPickup: Boolean(decoded.allowPickup),
        },
      });
    } catch {
      return NextResponse.json({ user: null });
    }
  }

  // Fallback to NextAuth handler
  return nextAuthHandler(req as any, context as any);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const resolvedParams = await context.params;
  const pathSegments = resolvedParams?.nextauth || [];
  const action = pathSegments[0];
  const subAction = pathSegments[1];

  // 1. /api/auth/callback/credentials
  if (action === "callback" && subAction === "credentials") {
    try {
      let body: any = {};
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        body = await req.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        body = Object.fromEntries(formData.entries());
      } else {
        try {
          body = await req.json();
        } catch {
          body = {};
        }
      }

      const { email, password } = body || {};

      if (!email || !password) {
        return NextResponse.json(
          { error: "CredentialsSignin", message: "Missing email or password" },
          { status: 400 }
        );
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: "CredentialsSignin", message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const isValid = await comparePassword(String(password), user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "CredentialsSignin", message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const userRole = user.role || "CUSTOMER";
      const allowCredit = user.allowCredit ?? false;
      const allowPickup = user.allowPickup ?? false;
      const tokenPayload = {
        id: user.id,
        name: user.name || "",
        email: user.email,
        role: userRole,
        allowCredit,
        allowPickup,
      };

      const sessionToken = await encode({
        token: tokenPayload,
        secret: NEXTAUTH_SECRET,
        maxAge: 30 * 24 * 60 * 60,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name || "",
          email: user.email,
          role: userRole,
          allowCredit,
          allowPickup,
        },
      });

      response.cookies.set("next-auth.session-token", sessionToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    } catch (err: any) {
      console.error("[NextAuth Callback] Error:", err);
      return NextResponse.json(
        { error: "CredentialsSignin", message: err.message || "Authentication error" },
        { status: 500 }
      );
    }
  }

  // 2. /api/auth/signout
  if (action === "signout") {
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set("next-auth.session-token", "", {
      path: "/",
      httpOnly: true,
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set("__Secure-next-auth.session-token", "", {
      path: "/",
      httpOnly: true,
      secure: true,
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }

  // Fallback to NextAuth handler
  return nextAuthHandler(req as any, context as any);
}
