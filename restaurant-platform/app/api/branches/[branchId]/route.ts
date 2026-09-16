import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 })
    }

    const { branchId } = await params

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, restaurantId: true },
    })

    if (!branch) {
      return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, branch.restaurantId)
    const isAdmin = user.role === "admin"

    if (access !== "owner" && access !== "manager" && !isAdmin) {
      return NextResponse.json(
        { error: "عذراً، يمتلك الصلاحية فقط صاحب المطعم أو المدير" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, address, phone, lat, lng, isActive, openingHours, deliveryRadiusKm, baseDeliveryFee, feePerKm } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (address !== undefined) updateData.address = address.trim()
    if (phone !== undefined) updateData.phone = phone.trim()
    if (lat !== undefined) updateData.lat = parseFloat(lat)
    if (lng !== undefined) updateData.lng = parseFloat(lng)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (openingHours !== undefined) updateData.openingHours = openingHours
    if (deliveryRadiusKm !== undefined) updateData.deliveryRadiusKm = parseFloat(deliveryRadiusKm)
    if (baseDeliveryFee !== undefined) updateData.baseDeliveryFee = parseFloat(baseDeliveryFee)
    if (feePerKm !== undefined) updateData.feePerKm = parseFloat(feePerKm)

    const updatedBranch = await prisma.branch.update({
      where: { id: branchId },
      data: updateData,
      include: {
        _count: {
          select: { menuCategories: true, orders: true },
        },
      },
    })

    revalidatePath("/dashboard/restaurant/branches")
    revalidatePath("/dashboard/restaurant")
    revalidatePath("/restaurant/[slug]", "page")

    return NextResponse.json(updatedBranch)
  } catch (error: any) {
    console.error("PATCH /api/branches/[branchId] error:", error)
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء تعديل الفرع" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ branchId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "غير مصرح بالدخول" }, { status: 401 })
    }

    const { branchId } = await params

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        restaurantId: true,
        _count: {
          select: { menuCategories: true },
        },
      },
    })

    if (!branch) {
      return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, branch.restaurantId)
    const isAdmin = user.role === "admin"

    if (access !== "owner" && access !== "manager" && !isAdmin) {
      return NextResponse.json(
        { error: "عذراً، يمتلك الصلاحية فقط صاحب المطعم أو المدير" },
        { status: 403 }
      )
    }

    // Check if this is the last branch for the restaurant
    const totalBranchesCount = await prisma.branch.count({
      where: { restaurantId: branch.restaurantId },
    })

    if (totalBranchesCount <= 1) {
      return NextResponse.json(
        { error: "لا يمكن حذف الفرع الوحيد المتبقي للمطعم" },
        { status: 400 }
      )
    }

    // Check if branch has linked MenuCategories
    if (branch._count.menuCategories > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف الفرع لاحتوائه على تصنيفات منيو مرتبطة به. يرجى نقل أو حذف المنيو الخاص بالفرع أولاً." },
        { status: 400 }
      )
    }

    await prisma.branch.delete({
      where: { id: branchId },
    })

    revalidatePath("/dashboard/restaurant/branches")
    revalidatePath("/dashboard/restaurant")
    revalidatePath("/restaurant/[slug]", "page")

    return NextResponse.json({ success: true, message: "تم حذف الفرع بنجاح" })
  } catch (error: any) {
    console.error("DELETE /api/branches/[branchId] error:", error)
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء حذف الفرع" },
      { status: 500 }
    )
  }
}

