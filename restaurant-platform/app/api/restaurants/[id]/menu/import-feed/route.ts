import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { getDefaultBranch } from "@/lib/restaurant"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    const { id: restaurantId } = await params

    const access = await getRestaurantAccess(user.id, restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح لك باستيراد المنيو. هذه العملية للمالك أو المدير فقط." },
        { status: 403 }
      )
    }

    const defaultBranch = await getDefaultBranch(restaurantId)
    if (!defaultBranch) {
      return NextResponse.json({ error: "لم يتم العثور على فرع افتراضي للمطعم" }, { status: 404 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار ملف للاستيراد" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const workbook = XLSX.read(buffer, { type: "buffer" })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    if (!worksheet) {
      return NextResponse.json({ error: "ملف Excel فارغ أو غير صالح" }, { status: 400 })
    }

    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ error: "لم يتم العثور على بيانات في ملف Excel" }, { status: 400 })
    }

    let categoriesCreatedCount = 0
    let itemsCreatedCount = 0
    let itemsUpdatedCount = 0
    const rowErrors: string[] = []

    await prisma.$transaction(async (tx) => {
      // Pre-fetch categories for this branch
      const categoryMap = new Map<string, string>()
      const existingCategories = await tx.menuCategory.findMany({
        where: { branchId: defaultBranch.id },
      })

      existingCategories.forEach((c) => {
        categoryMap.set(c.name.trim().toLowerCase(), c.id)
      })

      let currentMaxOrder = existingCategories.reduce((max, c) => Math.max(max, c.order), 0)

      // Pre-fetch all existing item IDs belonging to this restaurant to quickly validate provided IDs
      const existingRestaurantItems = await tx.menuItem.findMany({
        where: { category: { branch: { restaurantId } } },
        select: { id: true },
      })
      const validItemIdsSet = new Set(existingRestaurantItems.map((i) => i.id))

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i]
        const rowNum = i + 2 // 1-indexed accounting for header row

        const rawId = row["id"] || row["ID"] || row["Id"]
        const rawTitle = row["title"] || row["Title"] || row["name"] || row["Name"] || row["اسم الصنف"]
        const rawDescription = row["description"] || row["Description"] || row["الوصف"] || ""
        const rawAvailability = row["availability"] || row["Availability"] || row["متاح؟"]
        const rawPrice = row["price"] || row["Price"] || row["السعر"]
        const rawImageLink = row["image_link"] || row["Image_link"] || row["imageLink"] || row["Image"]
        const rawCategory = row["category"] || row["Category"] || row["اسم القسم"]

        if (!rawCategory || typeof rawCategory !== "string" || !rawCategory.trim()) {
          rowErrors.push(`الصف رقم ${rowNum}: اسم القسم مفقود أو غير صالح`)
          continue
        }

        const categoryName = rawCategory.trim()
        const categoryKey = categoryName.toLowerCase()

        // Get or Create Category
        let categoryId = categoryMap.get(categoryKey)
        if (!categoryId) {
          currentMaxOrder += 1
          const newCategory = await tx.menuCategory.create({
            data: {
              branchId: defaultBranch.id,
              name: categoryName,
              order: currentMaxOrder,
            },
          })
          categoryId = newCategory.id
          categoryMap.set(categoryKey, categoryId)
          categoriesCreatedCount += 1
        }

        if (!rawTitle || typeof rawTitle !== "string" || !rawTitle.trim()) {
          continue
        }

        const title = rawTitle.trim()

        // Parse price: handle numbers or strings like "45.00 EGP" or "45.00"
        let price = NaN
        if (typeof rawPrice === "number") {
          price = rawPrice
        } else if (rawPrice) {
          const match = String(rawPrice).match(/[\d.]+/)
          if (match) {
            price = parseFloat(match[0])
          }
        }

        if (isNaN(price) || price < 0) {
          rowErrors.push(`الصف رقم ${rowNum} (${title}): السعر غير صالح (${rawPrice})`)
          continue
        }

        // Parse availability: "in stock" -> true, "out of stock" -> false
        let isAvailable = true
        if (typeof rawAvailability !== "undefined" && rawAvailability !== null) {
          const availStr = String(rawAvailability).trim().toLowerCase()
          if (["out of stock", "out_of_stock", "false", "0", "لا", "غير متاح"].includes(availStr)) {
            isAvailable = false
          }
        }

        const itemIdStr = rawId ? String(rawId).trim() : ""
        const imageStr = rawImageLink ? String(rawImageLink).trim() : null
        const descriptionStr = rawDescription ? String(rawDescription).trim() : null

        // Check if ID exists in this restaurant
        if (itemIdStr && validItemIdsSet.has(itemIdStr)) {
          // UPDATE EXISTING ITEM
          await tx.menuItem.update({
            where: { id: itemIdStr },
            data: {
              name: title,
              description: descriptionStr,
              price,
              isAvailable,
              image: imageStr,
              categoryId,
            },
          })
          itemsUpdatedCount += 1
        } else {
          // CREATE NEW ITEM
          const newItem = await tx.menuItem.create({
            data: {
              categoryId,
              name: title,
              description: descriptionStr,
              price,
              isAvailable,
              image: imageStr,
            },
          })
          validItemIdsSet.add(newItem.id)
          itemsCreatedCount += 1
        }
      }
    })

    return NextResponse.json({
      message: "تم تنفيذ عملية استيراد Product Feed بنجاح",
      summary: {
        categoriesCreated: categoriesCreatedCount,
        itemsAdded: itemsCreatedCount,
        itemsUpdated: itemsUpdatedCount,
        totalRowsProcessed: rawRows.length,
        errorsCount: rowErrors.length,
      },
      errors: rowErrors,
    })
  } catch (error: any) {
    console.error("Error importing Product Feed menu:", error)
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء استيراد ملف Product Feed" },
      { status: 500 }
    )
  }
}
