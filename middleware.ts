import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  try {
    // Create a response object
    const res = NextResponse.next()

    // Check if this is an admin route
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

    // If it's an admin route, let the admin middleware handle it
    if (isAdminRoute) {
      // Check for admin session cookie
      const adminSession = req.cookies.get("adminSession")

      // Allow access to admin login page
      if (req.nextUrl.pathname === "/admin/login") {
        return NextResponse.next()
      }

      // Check if admin is logged in
      if (!adminSession || adminSession.value !== "true") {
        return NextResponse.redirect(new URL("/admin/login", req.url))
      }

      return NextResponse.next()
    }

    // For non-admin routes, handle app authentication
    const supabase = createMiddlewareClient({ req, res })

    // Refresh the session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    // If there's an error getting the session, log it and continue
    if (error) {
      console.error("Error getting session in middleware:", error)
      // Continue to the page without redirecting
      return NextResponse.next()
    }

    // Check if the request is for a protected route
    const isProtectedRoute = req.nextUrl.pathname.startsWith("/quiz/")

    // API routes should not be protected by this middleware
    const isApiRoute = req.nextUrl.pathname.startsWith("/api/")

    // Auth routes should not be redirected
    const isAuthRoute =
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/signup") ||
      req.nextUrl.pathname.startsWith("/auth")

    // If accessing a protected route without being logged in, redirect to login
    if (isProtectedRoute && !session && !isApiRoute && !isAuthRoute) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("returnUrl", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If accessing login/signup while logged in, redirect to home
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Add the session to the response
    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of an error, just continue to the page
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
