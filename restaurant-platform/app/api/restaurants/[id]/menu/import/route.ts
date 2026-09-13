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
    let itemsAddedCount = 0
    const rowErrors: string[] = []

    // Process rows inside Prisma transaction
    await prisma.$transaction(async (tx) => {
      // Map of existing/created categories: categoryName -> categoryId
      const categoryMap = new Map<string, string>()

      // Pre-fetch existing categories for this branch
      const existingCategories = await tx.menuCategory.findMany({
        where: { branchId: defaultBranch.id },
      })

      existingCategories.forEach((c) => {
        categoryMap.set(c.name.trim().toLowerCase(), c.id)
      })

      let currentMaxOrder = existingCategories.reduce((max, c) => Math.max(max, c.order), 0)

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i]
        const rowNum = i + 2 // 1-indexed row number considering header row

        const rawCategoryName = row["اسم القسم"] || row["Category"] || row["category"]
        const rawItemName = row["اسم الصنف"] || row["Item"] || row["item"] || row["Name"] || row["name"]
        const rawDescription = row["الوصف"] || row["Description"] || row["description"] || ""
        const rawPrice = row["السعر"] || row["Price"] || row["price"]
        const rawAvailable = row["متاح؟"] || row["Available"] || row["available"] || row["isAvailable"]

        if (!rawCategoryName || typeof rawCategoryName !== "string" || !rawCategoryName.trim()) {
          rowErrors.push(`الصف رقم ${rowNum}: اسم القسم مفقود أو غير صالح`)
          continue
        }

        const categoryName = rawCategoryName.trim()
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

        // If row only defines category (no item name), skip item creation
        if (!rawItemName || typeof rawItemName !== "string" || !rawItemName.trim()) {
          continue
        }

        const itemName = rawItemName.trim()

        // Validate Price
        let price = parseFloat(rawPrice)
        if (typeof rawPrice === "undefined" || isNaN(price) || price < 0) {
          rowErrors.push(`الصف رقم ${rowNum} (${itemName}): السعر غير صالح (${rawPrice})`)
          continue
        }

        // Validate Availability (نعم/يس/true = true)
        let isAvailable = true
        if (typeof rawAvailable !== "undefined" && rawAvailable !== null) {
          const availStr = String(rawAvailable).trim().toLowerCase()
          if (["لا", "no", "false", "0"].includes(availStr)) {
            isAvailable = false
          }
        }

        // Create Item
        await tx.menuItem.create({
          data: {
            categoryId,
            name: itemName,
            description: rawDescription ? String(rawDescription).trim() : null,
            price,
            isAvailable,
          },
        })

        itemsAddedCount += 1
      }
    })

    return NextResponse.json({
      message: "تم تنفيذ عملية استيراد المنيو بنجاح",
      summary: {
        categoriesCreated: categoriesCreatedCount,
        itemsAdded: itemsAddedCount,
        totalRowsProcessed: rawRows.length,
        errorsCount: rowErrors.length,
      },
      errors: rowErrors,
    })
  } catch (error) {
    console.error("Error importing menu:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء استيراد ملف المنيو" },
      { status: 500 }
    )
  }
}
