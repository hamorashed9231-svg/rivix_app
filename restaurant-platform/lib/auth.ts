import { NextAuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL === "") {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
  } else {
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("بيانات الدخول غير مكتملة")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة")
        }

        if (user.accountStatus === "pending") {
          throw new Error("حسابك قيد المراجعة من إدارة المنصة، سيتم التواصل معك قريبًا")
        }

        if (user.accountStatus === "rejected") {
          throw new Error("تم رفض طلب تسجيلك، للاستفسار تواصل مع الدعم")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function getCurrentUser(req?: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      return session.user
    }
  } catch (err) {
    // Ignore getServerSession errors outside Next request context
  }

  try {
    let authHeader: string | null = null

    if (req) {
      authHeader = req.headers.get("authorization") || req.headers.get("Authorization")
    } else {
      const { headers } = await import("next/headers")
      const reqHeaders = await headers()
      authHeader = reqHeaders.get("authorization") || reqHeaders.get("Authorization")
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const { verifyMobileToken } = await import("@/lib/driver-auth")
      const fakeReq = req || new Request("http://localhost", { headers: { Authorization: authHeader } })
      const payload = await verifyMobileToken(fakeReq)
      if (payload && (payload.userId || payload.id)) {
        const uid = String(payload.userId || payload.id)
        return {
          id: uid,
          name: String(payload.name || ""),
          email: String(payload.email || ""),
          role: ((payload.role as string) || "customer") as any,
        }
      }
    }
  } catch (err) {
    // Ignore header inspection errors in unit test environments
  }

  return undefined
}

export type RestaurantAccessLevel = "owner" | "manager" | "staff" | null

export async function getRestaurantAccess(
  userId: string,
  restaurantId: string
): Promise<RestaurantAccessLevel> {
  if (!userId || !restaurantId) return null

  const [user, restaurant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    }),
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    }),
  ])

  if (user?.role === "admin" || user?.role === "restaurant_admin") {
    return "owner"
  }

  if (restaurant && restaurant.ownerId === userId) {
    return "owner"
  }

  // Check if user is active staff member
  const staffRecord = await prisma.restaurantStaff.findUnique({
    where: {
      restaurantId_userId: {
        restaurantId,
        userId,
      },
    },
    select: {
      staffRole: true,
      isActive: true,
    },
  })

  if (staffRecord && staffRecord.isActive) {
    return staffRecord.staffRole === "manager" ? "manager" : "staff"
  }

  return null
}

