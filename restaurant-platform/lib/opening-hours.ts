export interface OpeningHoursData {
  open?: string
  close?: string
  is24Hours?: boolean
  [key: string]: any
}

export interface BranchOpenStatus {
  isOpen: boolean
  reason?: string
  formattedHours: string
}

/**
 * Parses time strings like "10:00 AM", "02:30 PM", "12:00 AM", "23:45"
 * into minutes from midnight (0 - 1439).
 */
export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr || typeof timeStr !== "string") return null
  const cleaned = timeStr.trim().toUpperCase()
  if (!cleaned) return null

  // 12-hour AM/PM format (e.g., "10:00 AM", "02:30 PM", "12:00 AM")
  const amPmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10)
    const minutes = parseInt(amPmMatch[2], 10)
    const period = amPmMatch[3]

    if (period === "AM") {
      if (hours === 12) hours = 0
    } else if (period === "PM") {
      if (hours !== 12) hours += 12
    }
    return hours * 60 + minutes
  }

  // 24-hour format (e.g., "10:00", "23:45", "00:30")
  const twentyFourMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourMatch) {
    const hours = parseInt(twentyFourMatch[1], 10)
    const minutes = parseInt(twentyFourMatch[2], 10)
    return hours * 60 + minutes
  }

  return null
}

/**
 * Checks if a branch is currently open based on its opening hours and active status.
 */
export function checkBranchOpenStatus(
  openingHoursRaw?: any,
  isActive: boolean = true,
  nowDate: Date = new Date()
): BranchOpenStatus {
  if (!isActive) {
    return {
      isOpen: false,
      reason: "الفرع غير مفعّل حالياً",
      formattedHours: "غير متاح",
    }
  }

  if (!openingHoursRaw) {
    return {
      isOpen: true,
      formattedHours: "مفتوح 24 ساعة",
    }
  }

  let hoursObj: OpeningHoursData = {}
  try {
    hoursObj = typeof openingHoursRaw === "string" ? JSON.parse(openingHoursRaw) : openingHoursRaw
  } catch (e) {
    hoursObj = {}
  }

  if (hoursObj.is24Hours || hoursObj.open === "24h") {
    return {
      isOpen: true,
      formattedHours: "مفتوح 24 ساعة",
    }
  }

  // Check day-specific key (e.g., monday, tuesday, etc.)
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const currentDayName = dayNames[nowDate.getDay()]

  let openTimeStr = hoursObj[currentDayName]?.open || hoursObj.open || "10:00 AM"
  let closeTimeStr = hoursObj[currentDayName]?.close || hoursObj.close || "12:00 AM"

  const openMinutes = parseTimeToMinutes(openTimeStr)
  const closeMinutes = parseTimeToMinutes(closeTimeStr)

  if (openMinutes === null || closeMinutes === null) {
    return {
      isOpen: true,
      formattedHours: `${openTimeStr} - ${closeTimeStr}`,
    }
  }

  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes()

  let isOpen = false
  if (openMinutes <= closeMinutes) {
    // Standard daytime shift (e.g., 10:00 AM to 11:00 PM)
    isOpen = nowMinutes >= openMinutes && nowMinutes <= closeMinutes
  } else {
    // Overnight shift spanning midnight (e.g., 11:00 AM to 02:00 AM)
    isOpen = nowMinutes >= openMinutes || nowMinutes <= closeMinutes
  }

  const formattedHours = `من ${openTimeStr} إلى ${closeTimeStr}`

  if (!isOpen) {
    return {
      isOpen: false,
      reason: `عذراً، الفرع مغلق حالياً ولا يستقبل طلبات جديدة. ساعات العمل: ${formattedHours}`,
      formattedHours,
    }
  }

  return {
    isOpen: true,
    formattedHours,
  }
}

export function isBranchOpen(openingHoursRaw?: any, isActive: boolean = true): boolean {
  return checkBranchOpenStatus(openingHoursRaw, isActive).isOpen
}
