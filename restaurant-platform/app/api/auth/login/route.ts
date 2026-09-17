import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signDriverToken } from "@/lib/driver-auth"

// In-memory rate limiting map: ipOrCode -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10 // max attempts per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute window

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count += 1
  return true
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1"
    const body = await req.json().catch(() => ({}))
    const { code, email, password } = body

    const rateKey = code ? `code_${code}_${ip}` : `email_${email || "unknown"}_${ip}`
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { success: false, error: "تم تجاوز عدد محاولات الدخول المسموح بها، يرجى الانتظار دقيقة" },
        { status: 429 }
      )
    }

    let user: any = null
    let driverProfile: any = null

    // 1. Quick login via driver code
    if (code && typeof code === "string") {
      const cleanCode = code.trim()
      driverProfile = await prisma.driverProfile.findUnique({
        where: { code: cleanCode },
        include: { user: true },
      })

      if (!driverProfile || !driverProfile.user) {
        return NextResponse.json(
          { success: false, error: "كود السائق غير صحيح أو الحساب غير موجود" },
          { status: 401 }
        )
      }

      user = driverProfile.user
    } else if (email && password) {
      // 2. Standard email + password login
      const cleanEmail = String(email).trim().toLowerCase()
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { driverProfile: true },
      })

      if (!user || !user.password) {
        return NextResponse.json(
          { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
          { status: 401 }
        )
      }

      const isValidPassword = await bcrypt.compare(String(password), user.password)
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
          { status: 401 }
        )
      }

      driverProfile = user.driverProfile
    } else {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال كود السائق أو البريد الإلكتروني وكلمة المرور" },
        { status: 400 }
      )
    }

    // Check account status
    if (user.accountStatus === "suspended" || user.accountStatus === "rejected") {
      return NextResponse.json(
        { success: false, error: "حساب السائق معطل أو غير مفعّل" },
        { status: 401 }
      )
    }

    // Issue JWT token using dedicated DRIVER_JWT_SECRET
    const token = await signDriverToken({
      id: user.id,
      userId: user.id,
      name: user.name,
      role: user.role,
      code: driverProfile?.code || null,
      restaurantId: driverProfile?.restaurantId || null,
      branchId: driverProfile?.branchId || null,
      status: driverProfile?.status || "offline",
    })

    // Return response adhering strictly to the driver app contract
    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          code: driverProfile?.code || "",
          branchId: driverProfile?.branchId || "",
          restaurantId: driverProfile?.restaurantId || "",
          status: driverProfile?.status || "offline",
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Driver Login Error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 500 }
    )
  }
}
