import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { getDefaultBranch } from "@/lib/restaurant"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET(
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
        { error: "غير مصرح لك بتصدير المنيو. هذه العملية للمالك أو المدير فقط." },
        { status: 403 }
      )
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true, slug: true },
    })

    if (!restaurant) {
      return NextResponse.json({ error: "المطعم غير موجود" }, { status: 404 })
    }

    const defaultBranch = await getDefaultBranch(restaurantId)
    if (!defaultBranch) {
      return NextResponse.json({ error: "لم يتم العثور على فرع افتراضي للمطعم" }, { status: 404 })
    }

    const categories = await prisma.menuCategory.findMany({
      where: { branchId: defaultBranch.id },
      include: {
        items: true,
      },
      orderBy: { order: "asc" },
    })

    // Prepare rows for Excel
    const excelRows: Array<{
      "اسم القسم": string
      "اسم الصنف": string
      "الوصف": string
      "السعر": number
      "متاح؟": string
    }> = []

    for (const category of categories) {
      if (category.items.length === 0) {
        // Include category even if it has no items
        excelRows.push({
          "اسم القسم": category.name,
          "اسم الصنف": "",
          "الوصف": "",
          "السعر": 0,
          "متاح؟": "نعم",
        })
      } else {
        for (const item of category.items) {
          excelRows.push({
            "اسم القسم": category.name,
            "اسم الصنف": item.name,
            "الوصف": item.description || "",
            "السعر": item.price,
            "متاح؟": item.isAvailable ? "نعم" : "لا",
          })
        }
      }
    }

    // Build Excel Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelRows)

    // Set column widths for readability
    worksheet["!cols"] = [
      { wch: 25 }, // اسم القسم
      { wch: 30 }, // اسم الصنف
      { wch: 45 }, // الوصف
      { wch: 15 }, // السعر
      { wch: 12 }, // متاح؟
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "المنيو")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    const fileName = `menu-export-${restaurant.slug || restaurantId}.xlsx`

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting menu:", error)
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر أثناء تصدير المنيو" },
      { status: 500 }
    )
  }
}
