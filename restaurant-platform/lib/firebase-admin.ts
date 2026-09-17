import { getApps, initializeApp, cert } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import fs from "fs"
import path from "path"

// Initialize Firebase Admin singleton gracefully
if (!getApps().length) {
  try {
    const serviceAccountPath = path.join(process.cwd(), "service-account.json")
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
      initializeApp({
        credential: cert(serviceAccount),
      })
      console.log("[Firebase Admin] Initialized with service-account.json")
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      initializeApp({
        credential: cert(serviceAccount),
      })
      console.log("[Firebase Admin] Initialized with FIREBASE_SERVICE_ACCOUNT_JSON env var")
    } else {
      console.warn("[Firebase Admin] WARNING: No service-account.json found. Push notifications will be skipped.")
    }
  } catch (err) {
    console.error("[Firebase Admin] Initialization Error:", err)
  }
}

/**
 * Sends a real FCM push notification when an order is assigned to a driver.
 */
export async function sendNewOrderPushNotification(fcmToken?: string | null, orderId?: string, orderNumber?: string) {
  if (!fcmToken) {
    console.warn(`[FCM] Skipping push notification for order #${orderId?.slice(-6) || "N/A"}: fcmToken is missing`)
    return
  }

  if (!getApps().length) {
    console.warn(`[FCM] Skipping push notification for order #${orderId?.slice(-6) || "N/A"}: Firebase Admin not initialized`)
    return
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: "طلب جديد للمندوب 🚀",
        body: `تم إسناد الطلب #${orderNumber || orderId?.slice(-6)} إليك. يرجى مراجعة التفاصيل والموافقة.`,
      },
      data: {
        orderId: orderId || "",
        type: "new_order_assigned",
      },
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "orders",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    }

    const response = await getMessaging().send(message)
    console.log(`[FCM] Push notification sent successfully for order #${orderId?.slice(-6)}:`, response)
  } catch (error) {
    console.error(`[FCM] Error sending push notification for order #${orderId?.slice(-6)}:`, error)
  }
}

/**
 * Sends a real FCM push notification when an order is cancelled.
 */
export async function sendOrderCancellationPushNotification(fcmToken?: string | null, orderId?: string, reason?: string) {
  if (!fcmToken) {
    console.warn(`[FCM] Skipping cancellation push for order #${orderId?.slice(-6) || "N/A"}: fcmToken is missing`)
    return
  }

  if (!getApps().length) {
    console.warn(`[FCM] Skipping cancellation push for order #${orderId?.slice(-6) || "N/A"}: Firebase Admin not initialized`)
    return
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: "تم إلغاء الطلب ❌",
        body: `تم إلغاء الطلب #${orderId?.slice(-6)}${reason ? `: ${reason}` : ""}`,
      },
      data: {
        orderId: orderId || "",
        type: "order_cancelled",
      },
      android: {
        priority: "high" as const,
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    }

    const response = await getMessaging().send(message)
    console.log(`[FCM] Cancellation push sent successfully for order #${orderId?.slice(-6)}:`, response)
  } catch (error) {
    console.error(`[FCM] Error sending cancellation push for order #${orderId?.slice(-6)}:`, error)
  }
}
