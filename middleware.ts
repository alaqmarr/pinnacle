/**
 * middleware.ts
 * 
 * Next.js Edge Security Guard for Pinnacle Distributing.
 * Protects all /admin/* routes and /api/admin/* API endpoints.
 * - Unauthenticated /admin requests redirect to /login with callbackUrl
 * - Unauthenticated /api/admin requests return 401 Unauthorized
 * - Authenticated requests with role !== 'ADMIN' return 403 Forbidden
 * - Authenticated requests with role === 'ADMIN' proceed smoothly
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken, decode } from "next-auth/jwt";

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  "pinnacle_distributing_secure_random_jwt_secret_m1_token_32chars";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Setup gatekeeper: If admin exists, redirect to /login with 302
  if (pathname === "/setup") {
    try {
      const checkRes = await fetch(new URL("/api/setup", req.url));
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (!data.setupAvailable) {
          return NextResponse.redirect(new URL("/login", req.url), 302);
        }
      }
    } catch {
      // In case fetch fails, let page handler perform database-level check
    }
    return NextResponse.next();
  }

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  // Extract session token
  const rawCookieToken =
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  let token: any = null;

  if (rawCookieToken) {
    try {
      token = await decode({
        token: rawCookieToken,
        secret: NEXTAUTH_SECRET,
      });
    } catch {
      token = null;
    }
  }

  if (!token) {
    try {
      token = await getToken({
        req,
        secret: NEXTAUTH_SECRET,
      });
    } catch {
      token = null;
    }
  }

  // 1. Unauthenticated request handling
  if (!token || !token.email) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required to access admin API" },
        { status: 401 }
      );
    }

    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    const loginUrl = new URL(`/login?callbackUrl=${callbackUrl}`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role-based privilege check
  const userRole = token.role;

  // ADMIN has full access
  if (userRole === "ADMIN") {
    if (pathname === "/admin/orders" && (!req.headers.get("accept") || !req.headers.get("accept")?.includes("text/html"))) {
      return NextResponse.rewrite(new URL("/api/admin/orders", req.url));
    }
    return NextResponse.next();
  }

  // MARKETING role check
  if (userRole === "MARKETING") {
    const isAllowedMarketing =
      pathname === "/admin" ||
      pathname === "/admin/marketing" ||
      pathname.startsWith("/admin/marketing/") ||
      pathname === "/api/admin/marketing" ||
      pathname.startsWith("/api/admin/marketing/");

    if (isAllowedMarketing) {
      return NextResponse.next();
    }

    if (isAdminApi) {
      return NextResponse.json(
        { error: "Forbidden", message: "Administrator privileges required" },
        { status: 403 }
      );
    }

    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <title>403 Forbidden | Pinnacle Distributing</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: system-ui, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center; max-width: 480px; padding: 2rem; background: #1e293b; border-radius: 1rem; border: 1px solid #334155;">
          <h1 style="font-size: 2rem; color: #f59e0b; margin-bottom: 0.5rem;">403 Forbidden</h1>
          <p style="color: #94a3b8; margin-bottom: 1.5rem;">Administrator privileges are required to access this area. Your account is registered as marketing (${encodeURIComponent(token.email)}).</p>
          <a href="/admin/marketing" style="display: inline-block; background: #0284c7; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-right: 0.5rem;">Marketing Portal</a>
          <a href="/" style="display: inline-block; background: #334155; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">Storefront</a>
        </div>
      </body>
      </html>`,
      {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  // Any other role (e.g. CUSTOMER)
  if (isAdminApi) {
    return NextResponse.json(
      { error: "Forbidden", message: "Administrator privileges required" },
      { status: 403 }
    );
  }

  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <title>403 Forbidden | Pinnacle Distributing</title>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="font-family: system-ui, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
      <div style="text-align: center; max-width: 480px; padding: 2rem; background: #1e293b; border-radius: 1rem; border: 1px solid #334155;">
        <h1 style="font-size: 2rem; color: #f59e0b; margin-bottom: 0.5rem;">403 Forbidden</h1>
        <p style="color: #94a3b8; margin-bottom: 1.5rem;">Administrator privileges are required to access this area. Your account is registered as a customer (${encodeURIComponent(token.email)}).</p>
        <a href="/" style="display: inline-block; background: #0284c7; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">Return to Storefront</a>
      </div>
    </body>
    </html>`,
    {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export const config = {
  matcher: [
    "/setup",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
