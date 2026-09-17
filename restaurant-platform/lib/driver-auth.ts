import { SignJWT, jwtVerify } from "jose"

export const DRIVER_JWT_SECRET =
  process.env.DRIVER_JWT_SECRET ||
  "driver-jwt-secret-rivix-9f8a7b6c5d4e3f2a1b0c"

const encodedSecret = Buffer.from(DRIVER_JWT_SECRET, "utf-8")

export interface DriverTokenPayload {
  id: string
  userId: string
  name: string
  role: string
  code?: string | null
  restaurantId?: string | null
  branchId?: string | null
  status?: string | null
}

/**
 * Signs a dedicated driver JWT using DRIVER_JWT_SECRET.
 */
export async function signDriverToken(payload: DriverTokenPayload): Promise<string> {
  return await new SignJWT({
    sub: payload.userId,
    id: payload.id,
    userId: payload.userId,
    name: payload.name,
    role: payload.role,
    code: payload.code,
    restaurantId: payload.restaurantId,
    branchId: payload.branchId,
    status: payload.status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedSecret)
}

/**
 * Verifies incoming Authorization Bearer token against DRIVER_JWT_SECRET
 * and ensures the user role is authorized.
 */
export async function verifyDriverToken(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const tokenStr = authHeader.substring(7).trim()
  if (!tokenStr) return null

  try {
    const { payload } = await jwtVerify(tokenStr, encodedSecret)

    if (!payload) return null

    const allowedRoles = ["rider", "control", "supermarket_control", "admin", "restaurant_owner"]
    const role = (payload.role as string) || ""

    if (!allowedRoles.includes(role)) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

/**
 * Verifies control roles: control, supermarket_control, supervisor, admin, restaurant_owner.
 */
export async function verifyControlToken(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const tokenStr = authHeader.substring(7).trim()
  if (!tokenStr) return null

  try {
    const { payload } = await jwtVerify(tokenStr, encodedSecret)
    if (!payload) return null

    const allowedRoles = [
      "control",
      "supermarket_control",
      "supervisor",
      "admin",
      "restaurant_owner",
      "restaurant_admin",
    ]
    const role = (payload.role as string) || ""

    if (!allowedRoles.includes(role)) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

