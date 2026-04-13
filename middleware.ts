import { NextRequest, NextResponse } from "next/server";

// Admin-only routes that require role verification
const ADMIN_ROUTES = ["/members", "/registrations", "/purchases", "/reports"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static assets
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (Better Auth uses __session or better-auth.session_token)
  const sessionCookie =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__session")?.value;

  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  // If user is NOT logged in and trying to access dashboard pages -> redirect to sign-in
  if (!sessionCookie && !isAuthPage) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If user IS logged in and trying to access auth pages -> redirect to dashboard
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin route protection: check role from session
  if (sessionCookie) {
    const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

    if (isAdminRoute) {
      try {
        // Verify session and check role via Better Auth API
        const sessionResponse = await fetch(
          new URL("/api/auth/get-session", request.url),
          {
            headers: {
              cookie: request.headers.get("cookie") || "",
            },
          }
        );

        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          if (session?.user?.role !== "admin") {
            // Non-admin trying to access admin route -> redirect to home
            return NextResponse.redirect(new URL("/", request.url));
          }
        }
      } catch {
        // If session check fails, allow through (layout will handle)
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next (Next.js internals)
     * - static files (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
