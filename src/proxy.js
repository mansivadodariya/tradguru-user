import { NextResponse } from "next/server";

// Routes that require a logged-in user
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/trade-snap",
  "/ai-assistant",
  "/economic-calendar",
  "/ai-strategy",
  "/credit-history",
  "/plans",
  "/broker",
  "/brokers",
  "/profile",
  "/settings",
];

// Auth routes — already-logged-in users should be bounced to /dashboard or their intended redirect
const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const isLoggedIn = Boolean(token);
  const hasPhone = request.cookies.get("has_phone")?.value === "true";

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && isLoggedIn && !hasPhone) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("need_phone", "true");
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isLoggedIn) {
    if (hasPhone) {
      const redirectTarget = request.nextUrl.searchParams.get("redirect") || "/dashboard";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trade-snap/:path*",
    "/ai-assistant/:path*",
    "/economic-calendar/:path*",
    "/ai-strategy",
    "/ai-strategy/:path*",
    "/credit-history/:path*",
    "/plans/:path*",
    "/broker/:path*",
    "/brokers/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};
