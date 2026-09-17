import { v2 as cloudinary } from "cloudinary"
import { prisma } from "@/lib/prisma"
import { publishOrderEvent } from "@/lib/notifications-pubsub"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "ssxzupqi",
  api_key: process.env.CLOUDINARY_API_KEY || "535252577583347",
  api_secret: process.env.CLOUDINARY_API_SECRET || "ohGdSm2GWz76qJm6eKuOkpVuEgo",
  secure: true,
})

/**
 * Calculates distance in meters between two lat/lng points using the Haversine formula.
 */
export function calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (lat1 === lat2 && lng1 === lng2) return 0
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const STATUS_SEQUENCE: Record<string, number> = {
  pending: 1,
  assigned: 2,
  accepted: 3,
  arrived_restaurant: 4,
  picked_up: 5,
  on_the_way: 6,
  arrived_customer: 7,
  delivered: 8,
  cancelled: 99,
}

/**
 * Validates state transition order.
 */
export function isValidStatusTransition(currentStatus: string | null | undefined, newStatus: string): boolean {
  if (!newStatus) return false
  const currentNorm = (currentStatus || "pending").toLowerCase()
  const newNorm = newStatus.toLowerCase()

  if (newNorm === "cancelled") {
    return currentNorm !== "delivered" && currentNorm !== "cancelled"
  }

  const currentStep = STATUS_SEQUENCE[currentNorm] || 1
  const newStep = STATUS_SEQUENCE[newNorm] || 0

  return newStep === currentStep + 1 || newStep === currentStep
}

/**
 * Uploads a base64 string or URL to Cloudinary. Returns the secure URL.
 */
export async function uploadBase64ToCloudinary(base64Data: string, folder: string = "rivix/pod"): Promise<string> {
  if (!base64Data) return ""
  if (base64Data.startsWith("http://") || base64Data.startsWith("https://")) {
    return base64Data
  }

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: "auto",
    })
    return result.secure_url
  } catch (error) {
    console.error("Cloudinary upload error in driver-helpers:", error)
    return base64Data
  }
}

/**
 * Shared 10-hour lazy shift auto-close helper.
 */
export async function checkAndAutoCloseShift(riderProfileId: string) {
  if (!riderProfileId) return

  try {
    const openShift = await prisma.shift.findFirst({
      where: {
        riderId: riderProfileId,
        endTime: null,
      },
    })

    if (!openShift) return

    const now = new Date()
    const shiftStart = new Date(openShift.startTime)
    const durationMs = now.getTime() - shiftStart.getTime()
    const TEN_HOURS_MS = 10 * 60 * 60 * 1000

    if (durationMs > TEN_HOURS_MS) {
      const autoClosedEndTime = new Date(shiftStart.getTime() + TEN_HOURS_MS)
      await prisma.shift.update({
        where: { id: openShift.id },
        data: {
          endTime: autoClosedEndTime,
          durationMinutes: 600,
          autoClosed: true,
        },
      })

      await prisma.driverProfile.update({
        where: { id: riderProfileId },
        data: {
          status: "offline",
          currentShiftStart: null,
        },
      })
    }
  } catch (error) {
    console.error("Shift Auto-Close Check Error:", error)
  }
}

export interface PodDataInput {
  podType?: string
  deliveryOtp?: string
  podSignature?: string
  podPhoto?: string
  deliveredPaymentMethod?: string
  deliveredLocation?: { lat: number; lng: number }
}

/**
 * Shared status transition logic used by both PATCH status and POST batch-sync endpoints.
 */
export async function applyOrderStatusTransition(
  orderId: string,
  newStatus: string,
  riderUserId: string,
  podData?: PodDataInput,
  customTimestamp?: Date
): Promise<{ success: boolean; error?: string; order?: any }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { branch: true },
  })

  if (!order) {
    return { success: false, error: "الطلب غير موجود" }
  }

  // Check state transition validity
  if (!isValidStatusTransition(order.riderDeliveryStatus, newStatus)) {
    return {
      success: false,
      error: `انتقال حالة غير مسموح به من '${order.riderDeliveryStatus || "pending"}' إلى '${newStatus}'`,
    }
  }

  const now = customTimestamp || new Date()
  const updateData: any = {
    riderDeliveryStatus: newStatus,
    updatedAt: now,
  }

  // Stamp corresponding timestamp field
  switch (newStatus) {
    case "assigned":
      updateData.assignedAt = now
      break
    case "accepted":
      updateData.acceptedAt = now
      break
    case "arrived_restaurant":
      updateData.arrivedRestaurantAt = now
      break
    case "picked_up":
      updateData.pickedAt = now
      break
    case "on_the_way":
      updateData.onTheWayAt = now
      break
    case "arrived_customer":
      updateData.arrivedCustomerAt = now
      break
    case "delivered":
      updateData.deliveredAt = now
      updateData.podVerifiedAt = now
      break
  }

  // Handle POD & OTP logic when delivered
  if (newStatus === "delivered") {
    const podType = podData?.podType || order.podType || "otp"
    updateData.podType = podType

    if (podType === "otp") {
      const providedOtp = podData?.deliveryOtp?.trim()
      const expectedOtp = order.deliveryOtp?.trim()

      if (expectedOtp && providedOtp !== expectedOtp) {
        return { success: false, error: "رمز التأكيد (OTP) غير صحيح" }
      }
      updateData.podOtpVerified = true
    } else if (podType === "signature" || podType === "photo") {
      if (podData?.podSignature) {
        updateData.podSignature = await uploadBase64ToCloudinary(podData.podSignature, "rivix/signatures")
      }
      if (podData?.podPhoto) {
        updateData.podPhoto = await uploadBase64ToCloudinary(podData.podPhoto, "rivix/pod_photos")
      }
    }

    if (podData?.deliveredPaymentMethod) {
      updateData.deliveredPaymentMethod = podData.deliveredPaymentMethod
    }
    if (podData?.deliveredLocation) {
      updateData.deliveredLocationLat = podData.deliveredLocation.lat
      updateData.deliveredLocationLng = podData.deliveredLocation.lng
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  })

  // Trigger Firestore PubSub event for real-time customer tracking
  if (order.branch?.restaurantId) {
    publishOrderEvent(order.branch.restaurantId, "order_status_changed", order.id).catch((err) =>
      console.error("PubSub error:", err)
    )
  }

  return { success: true, order: updatedOrder }
}
