import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const adminSession = request.cookies.get("adminSession")
  const { pathname } = request.nextUrl

  // Allow access to login page
  if (pathname === "/admin/login") {
    return NextResponse.next()
  }

  // Check if admin is logged in
  if (!adminSession || adminSession.value !== "true") {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
