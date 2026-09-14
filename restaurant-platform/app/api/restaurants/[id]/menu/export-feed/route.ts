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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rivix.app"

    // Prepare Product Feed Excel rows
    const excelRows: Array<{
      id: string
      title: string
      description: string
      availability: string
      condition: string
      price: string
      link: string
      image_link: string
      brand: string
      category: string
    }> = []

    for (const category of categories) {
      for (const item of category.items) {
        excelRows.push({
          id: item.id,
          title: item.name,
          description: item.description || "",
          availability: item.isAvailable ? "in stock" : "out of stock",
          condition: "new",
          price: `${item.price.toFixed(2)} EGP`,
          link: `${baseUrl}/restaurant/${restaurant.slug || restaurantId}#item-${item.id}`,
          image_link: item.image || "",
          brand: restaurant.name,
          category: category.name,
        })
      }
    }

    // Build Excel Workbook
    const worksheet = XLSX.utils.json_to_sheet(excelRows, {
      header: [
        "id",
        "title",
        "description",
        "availability",
        "condition",
        "price",
        "link",
        "image_link",
        "brand",
        "category",
      ],
    })

    // Set column widths
    worksheet["!cols"] = [
      { wch: 28 }, // id
      { wch: 30 }, // title
      { wch: 45 }, // description
      { wch: 15 }, // availability
      { wch: 12 }, // condition
      { wch: 15 }, // price
      { wch: 50 }, // link
      { wch: 45 }, // image_link
      { wch: 25 }, // brand
      { wch: 25 }, // category
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Feed")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    const fileName = `menu-feed-${restaurant.slug || restaurantId}.xlsx`

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting product feed menu:", error)
    return NextResponse.json(
      { error: "حدث خطأ في السيرفر أثناء تصدير المنيو بصيغة Product Feed" },
      { status: 500 }
    )
  }
}
