import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
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
        { error: "غير مصرح لك بتحميل النموذج." },
        { status: 403 }
      )
    }

    const sampleRows = [
      {
        id: "", // Empty for new item creation
        title: "ساندوتش برجر دجاج سوبريم",
        description: "قطع دجاج مقرمش مع جبنة شيدر، خس طازج وصوص ريفيكس المميز",
        availability: "in stock",
        condition: "new",
        price: "120.00 EGP",
        link: "https://rivix.app/restaurant/sample#item-1",
        image_link: "https://example.com/images/burger.jpg",
        brand: "اسم المطعم",
        category: "الساندوتشات والوجبات",
      },
      {
        id: "",
        title: "عصير برتقال طبيعي",
        description: "برتقال طبيعي طازج 100% بدون سكر مضاف",
        availability: "in stock",
        condition: "new",
        price: "35.00 EGP",
        link: "https://rivix.app/restaurant/sample#item-2",
        image_link: "https://example.com/images/juice.jpg",
        brand: "اسم المطعم",
        category: "المشروبات والحلويات",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleRows, {
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

    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 30 },
      { wch: 50 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 45 },
      { wch: 45 },
      { wch: 20 },
      { wch: 25 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Feed Sample")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="menu-product-feed-template.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error generating product feed template:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء نموذج Product Feed" },
      { status: 500 }
    )
  }
}
