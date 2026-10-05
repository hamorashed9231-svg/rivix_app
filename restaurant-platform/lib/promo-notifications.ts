import { prisma } from "@/lib/prisma"

export interface BroadcastPromoParams {
  restaurantId?: string | null
  title: string
  body: string
  type?: "offer" | "discount" | "coupon"
  couponCode?: string | null
  createdById?: string | null
}

/**
 * Saves a PromoNotification in DB (for in-app / local notification sync across all installed clients)
 * AND dispatches real Expo Push Notifications to all registered device push tokens.
 */
export async function broadcastPromoNotification(params: BroadcastPromoParams) {
  const {
    restaurantId = null,
    title,
    body,
    type = "offer",
    couponCode = null,
    createdById = null,
  } = params

  if (!title.trim() || !body.trim()) {
    return null
  }

  let savedNotification = null
  try {
    savedNotification = await prisma.promoNotification.create({
      data: {
        restaurantId,
        title: title.trim(),
        body: body.trim(),
        type,
        couponCode,
        createdById,
      },
    })
  } catch (err) {
    console.error("[PromoNotification] Error saving notification to DB:", err)
  }

  try {
    const tokensRecords = await prisma.devicePushToken.findMany({
      where: restaurantId
        ? {
            OR: [{ restaurantId }, { restaurantId: null }],
          }
        : undefined,
      select: { token: true },
    })

    const validTokens = Array.from(
      new Set(
        tokensRecords
          .map((t) => t.token)
          .filter(
            (token) =>
              token.startsWith("ExponentPushToken[") ||
              token.startsWith("ExpoPushToken[")
          )
      )
    )

    if (validTokens.length > 0) {
      const messages = validTokens.map((to) => ({
        to,
        sound: "default",
        title: title.trim(),
        body: body.trim(),
        priority: "high",
        channelId: "default",
        data: {
          notificationId: savedNotification?.id,
          restaurantId,
          type,
          couponCode,
        },
      }))

      // Send in chunks of 100 per Expo Push API spec
      for (let i = 0; i < messages.length; i += 100) {
        const chunk = messages.slice(i, i + 100)
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(chunk),
        }).catch((pushErr) =>
          console.warn("[PromoNotification] Expo Push HTTP error:", pushErr)
        )
      }
    }
  } catch (err) {
    console.warn("[PromoNotification] Error dispatching push tokens:", err)
  }

  return savedNotification
}
