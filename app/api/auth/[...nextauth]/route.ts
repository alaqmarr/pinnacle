/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * NextAuth route handler for Next.js App Router.
 * Intercepts all built-in NextAuth UI routes (/signin, /signout, /error) so
 * default NextAuth pages are NEVER shown, while supporting both NextAuth client
 * helpers (signIn/signOut/useSession) and direct JSON API authentication.
 */

import NextAuth from "next-auth";
import { authOptions, NEXTAUTH_SECRET } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { encode, decode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/security";
import crypto from "crypto";

const nextAuthHandler = NextAuth(authOptions);

function getRequestOrigin(req: NextRequest): string {
  const originHeader = req.headers.get("origin");
  if (originHeader) return originHeader;

  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.nextUrl.protocol ? req.nextUrl.protocol.replace(":", "") : "http");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;

  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

function isHttpsRequest(req: NextRequest): boolean {
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return req.nextUrl.protocol === "https:";
}

function resolveDefaultRedirectPath(role: string): string {
  if (role === "ADMIN") return "/admin";
  if (role === "MARKETING") return "/admin/marketing";
  return "/account";
}

function resolveTargetUrl(
  origin: string,
  callbackParam: unknown,
  role: string
): string {
  const defaultPath = resolveDefaultRedirectPath(role);
  if (!callbackParam || typeof callbackParam !== "string") {
    return `${origin}${defaultPath}`;
  }

  let pathOrUrl = callbackParam.trim();
  if (!pathOrUrl) {
    return `${origin}${defaultPath}`;
  }

  // Normalize same-origin absolute URLs to inspect pathname
  let pathname = pathOrUrl;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    try {
      const parsed = new URL(pathOrUrl);
      const originUrl = new URL(origin);
      if (parsed.host !== originUrl.host) {
        return `${origin}${defaultPath}`;
      }
      pathname = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return `${origin}${defaultPath}`;
    }
  } else if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  // Prevent non-admin customers from landing on /admin 403 Forbidden
  if (role === "CUSTOMER" && pathname.startsWith("/admin")) {
    return `${origin}/account`;
  }
  // Prevent marketing users from landing on admin-only routes other than /admin/marketing
  if (
    role === "MARKETING" &&
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/marketing")
  ) {
    return `${origin}/admin/marketing`;
  }
  // Avoid redirecting back onto auth pages in a loop
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/logout") ||
    pathname.startsWith("/api/auth")
  ) {
    return `${origin}${defaultPath}`;
  }

  return `${origin}${pathname}`;
}

function extractSessionTokenFromRequest(req: NextRequest): string | undefined {
  let token =
    req.cookies.get("__Secure-next-auth.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value;

  if (!token) {
    for (const baseName of [
      "__Secure-next-auth.session-token",
      "next-auth.session-token",
    ]) {
      if (req.cookies.get(`${baseName}.0`)?.value) {
        let full = "";
        let i = 0;
        while (req.cookies.get(`${baseName}.${i}`)?.value) {
          full += req.cookies.get(`${baseName}.${i}`)?.value || "";
          i++;
        }
        if (full) {
          token = full;
          break;
        }
      }
    }
  }

  if (!token) return undefined;
  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

function clearAuthCookies(response: NextResponse) {
  const expiredOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 0,
    expires: new Date(0),
  };

  for (const name of [
    "next-auth.session-token",
    "next-auth.session-token.0",
    "next-auth.session-token.1",
    "next-auth.callback-url",
  ]) {
    response.cookies.set(name, "", expiredOptions);
  }

  for (const secureName of [
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.session-token.0",
    "__Secure-next-auth.session-token.1",
    "__Secure-next-auth.callback-url",
  ]) {
    response.cookies.set(secureName, "", {
      ...expiredOptions,
      secure: true,
    });
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const resolvedParams = await context.params;
  const pathSegments = resolvedParams?.nextauth || [];
  const action = pathSegments[0];
  const origin = getRequestOrigin(req);

  // Never expose built-in NextAuth HTML pages
  if (action === "signin") {
    return NextResponse.redirect(
      new URL(`/login${req.nextUrl.search}`, origin)
    );
  }

  if (action === "signout") {
    return NextResponse.redirect(
      new URL(`/logout${req.nextUrl.search}`, origin)
    );
  }

  if (action === "error") {
    return NextResponse.redirect(
      new URL(`/login${req.nextUrl.search}`, origin)
    );
  }

  // 1. /api/auth/providers
  if (action === "providers") {
    return NextResponse.json({
      credentials: {
        id: "credentials",
        name: "Credentials",
        type: "credentials",
        signinUrl: `${origin}/api/auth/signin/credentials`,
        callbackUrl: `${origin}/api/auth/callback/credentials`,
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
          secure: isHttpsRequest(req),
        }
      );
    }
    return response;
  }

  // 3. /api/auth/session
  // Note: NextAuth's client useSession() treats `{}` as unauthenticated and any non-empty object as authenticated.
  if (action === "session") {
    const sessionToken = extractSessionTokenFromRequest(req);
    if (!sessionToken) {
      return NextResponse.json({});
    }

    try {
      const decoded = await decode({
        token: sessionToken,
        secret: NEXTAUTH_SECRET,
      });

      if (!decoded || !decoded.email) {
        return NextResponse.json({});
      }

      const userId = (decoded.id as string) || (decoded.sub as string) || "";
      if (!userId) {
        return NextResponse.json({});
      }

      // Verify user still exists in database so deleted/reset accounts never leave ghost sessions
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          allowCredit: true,
          allowPickup: true,
        },
      });

      if (!dbUser) {
        const res = NextResponse.json({});
        clearAuthCookies(res);
        return res;
      }

      const expSeconds =
        typeof decoded.exp === "number"
          ? decoded.exp
          : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      return NextResponse.json({
        user: {
          id: dbUser.id,
          name: dbUser.name || "",
          email: dbUser.email,
          role: dbUser.role || "CUSTOMER",
          allowCredit: Boolean(dbUser.allowCredit),
          allowPickup: Boolean(dbUser.allowPickup),
        },
        expires: new Date(expSeconds * 1000).toISOString(),
      });
    } catch {
      return NextResponse.json({});
    }
  }

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
  const origin = getRequestOrigin(req);
  const https = isHttpsRequest(req);

  // Intercept /api/auth/signin/* POSTs so default NextAuth pages never render
  if (action === "signin" && subAction !== "credentials") {
    return NextResponse.redirect(new URL("/login", origin), 303);
  }

  // 1. /api/auth/callback/credentials
  if (action === "callback" && subAction === "credentials") {
    try {
      let body: Record<string, any> = {};
      const contentType = req.headers.get("content-type") || "";
      const isFormPost =
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data");
      const wantsJson =
        contentType.includes("application/json") ||
        body?.json === "true" ||
        req.headers.get("accept")?.includes("application/json");

      if (contentType.includes("application/json")) {
        body = await req.json();
      } else if (isFormPost) {
        const formData = await req.formData();
        body = Object.fromEntries(formData.entries());
      } else {
        try {
          body = await req.json();
        } catch {
          body = {};
        }
      }

      const sendJson =
        contentType.includes("application/json") ||
        body?.json === "true" ||
        wantsJson;

      const errorUrl = `${origin}/login?error=CredentialsSignin`;
      const { email, password } = body || {};

      if (!email || !password) {
        if (!sendJson) {
          return NextResponse.redirect(errorUrl, 303);
        }
        return NextResponse.json(
          {
            error: "CredentialsSignin",
            message: "Missing email or password",
            url: errorUrl,
          },
          { status: 400 }
        );
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user || !user.passwordHash) {
        if (!sendJson) {
          return NextResponse.redirect(errorUrl, 303);
        }
        return NextResponse.json(
          {
            error: "CredentialsSignin",
            message: "Invalid credentials",
            url: errorUrl,
          },
          { status: 401 }
        );
      }

      const isValid = await comparePassword(
        String(password),
        user.passwordHash
      );
      if (!isValid) {
        if (!sendJson) {
          return NextResponse.redirect(errorUrl, 303);
        }
        return NextResponse.json(
          {
            error: "CredentialsSignin",
            message: "Invalid credentials",
            url: errorUrl,
          },
          { status: 401 }
        );
      }

      const userRole = user.role || "CUSTOMER";
      const allowCredit = user.allowCredit ?? false;
      const allowPickup = user.allowPickup ?? false;
      const targetUrl = resolveTargetUrl(origin, body?.callbackUrl, userRole);

      const tokenPayload = {
        id: user.id,
        sub: user.id,
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

      const response = sendJson
        ? NextResponse.json({
            success: true,
            url: targetUrl,
            user: {
              id: user.id,
              name: user.name || "",
              email: user.email,
              role: userRole,
              allowCredit,
              allowPickup,
            },
          })
        : NextResponse.redirect(targetUrl, 303);

      response.cookies.set("next-auth.session-token", sessionToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: https,
        maxAge: 30 * 24 * 60 * 60,
      });

      if (https) {
        response.cookies.set(
          "__Secure-next-auth.session-token",
          sessionToken,
          {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: true,
            maxAge: 30 * 24 * 60 * 60,
          }
        );
      }

      return response;
    } catch (err: any) {
      console.error("[NextAuth Callback] Error:", err);
      return NextResponse.json(
        {
          error: "CredentialsSignin",
          message: err.message || "Authentication error",
          url: `${origin}/login?error=CredentialsSignin`,
        },
        { status: 500 }
      );
    }
  }

  // 2. /api/auth/signout
  if (action === "signout") {
    let body: Record<string, any> = {};
    const contentType = req.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        body = await req.json();
      } else if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        const formData = await req.formData();
        body = Object.fromEntries(formData.entries());
      }
    } catch {
      body = {};
    }

    const rawCallback =
      body?.callbackUrl || req.nextUrl.searchParams.get("callbackUrl") || "/login?signedOut=true";
    let redirectUrl = `${origin}/login?signedOut=true`;
    if (typeof rawCallback === "string" && rawCallback.trim()) {
      if (
        rawCallback.startsWith("http://") ||
        rawCallback.startsWith("https://")
      ) {
        try {
          const parsed = new URL(rawCallback);
          const originUrl = new URL(origin);
          if (parsed.host === originUrl.host) {
            redirectUrl = rawCallback;
          }
        } catch {
          // keep default
        }
      } else {
        redirectUrl = `${origin}${rawCallback.startsWith("/") ? rawCallback : `/${rawCallback}`}`;
      }
    }

    const expectsJson =
      contentType.includes("application/json") ||
      body?.json === "true" ||
      req.headers.get("accept")?.includes("application/json");

    const response = expectsJson
      ? NextResponse.json({ success: true, url: redirectUrl }, { status: 200 })
      : NextResponse.redirect(redirectUrl, 303);

    clearAuthCookies(response);
    return response;
  }

  return nextAuthHandler(req as any, context as any);
}
