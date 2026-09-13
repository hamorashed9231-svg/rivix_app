import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
    // 1. Unauthenticated users -> redirect to login
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = token.role

    // 2. Protect Admin-only routes (/dashboard/admin/*)
    if (pathname.startsWith("/dashboard/admin")) {
      if (userRole !== "admin") {
        // Redirect non-admin users (e.g. restaurant_owner) to standard dashboard
        const ownerDashboardUrl = new URL("/dashboard/restaurant", req.url)
        return NextResponse.redirect(ownerDashboardUrl)
      }
    }

    // 3. Ensure user has a valid dashboard role
    if (userRole !== "restaurant_owner" && userRole !== "admin") {
      const homeUrl = new URL("/", req.url)
      homeUrl.searchParams.set("error", "unauthorized")
      return NextResponse.redirect(homeUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
