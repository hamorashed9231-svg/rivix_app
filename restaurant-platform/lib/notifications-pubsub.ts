import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type OrderEventType = "new_order" | "order_status_changed"

export async function publishOrderEvent(
  restaurantId: string,
  eventType: OrderEventType,
  orderId: string
) {
  try {
    if (!restaurantId || !orderId) return

    const eventsRef = collection(db, "restaurants", restaurantId, "events")
    await addDoc(eventsRef, {
      type: eventType,
      orderId,
      timestamp: serverTimestamp(),
      createdTime: Date.now(),
    })

    console.log(`[PubSub] Published event '${eventType}' for order #${orderId.slice(-6)}`)
  } catch (error) {
    console.error("PubSub Publish Event Error:", error)
  }
}
