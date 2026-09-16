import { NextResponse } from "next/server"
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Retrieve option groups and options for a menu item
export async function GET(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params

    const groups = await prisma.itemOptionGroup.findMany({
      where: { menuItemId: itemId },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ groups })
  } catch (error) {
    console.error("Error fetching item options:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الخيارات" }, { status: 500 })
  }
}

// POST: Add or update an option group with options for a menu item
export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    const { itemId } = await params

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          include: {
            branch: { select: { restaurantId: true } },
          },
        },
      },
    })

    if (!item || !item.category || !item.category.branch) {
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, item.category.branch.restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح لك بإدارة إضافات هذا الصنف" }, { status: 403 })
    }

    const body = await req.json()
    const { id, name, selectionType, isRequired, minSelect, maxSelect, options } = body

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "اسم مجموعة الخيارات مطلوب" }, { status: 400 })
    }

    let group

    if (id) {
      // Update existing group
      group = await prisma.itemOptionGroup.update({
        where: { id },
        data: {
          name: name.trim(),
          selectionType: selectionType === "multiple" ? "multiple" : "single",
          isRequired: Boolean(isRequired),
          minSelect: typeof minSelect === "number" ? minSelect : 0,
          maxSelect: typeof maxSelect === "number" ? maxSelect : 1,
        },
      })

      // Sync options: delete old and recreate
      if (Array.isArray(options)) {
        await prisma.itemOption.deleteMany({
          where: { optionGroupId: id },
        })

        if (options.length > 0) {
          await prisma.itemOption.createMany({
            data: options.map((opt: any, index: number) => ({
              optionGroupId: id,
              name: opt.name?.trim() || "خيار",
              price: typeof opt.price === "number" ? opt.price : parseFloat(opt.price || 0),
              isDefault: Boolean(opt.isDefault),
              order: index,
            })),
          })
        }
      }
    } else {
      // Create new group with options
      group = await prisma.itemOptionGroup.create({
        data: {
          menuItemId: itemId,
          name: name.trim(),
          selectionType: selectionType === "multiple" ? "multiple" : "single",
          isRequired: Boolean(isRequired),
          minSelect: typeof minSelect === "number" ? minSelect : 0,
          maxSelect: typeof maxSelect === "number" ? maxSelect : 1,
          options: {
            create: Array.isArray(options)
              ? options.map((opt: any, index: number) => ({
                  name: opt.name?.trim() || "خيار",
                  price: typeof opt.price === "number" ? opt.price : parseFloat(opt.price || 0),
                  isDefault: Boolean(opt.isDefault),
                  order: index,
                }))
              : [],
          },
        },
        include: {
          options: true,
        },
      })
    }

    const updatedGroup = await prisma.itemOptionGroup.findUnique({
      where: { id: group.id },
      include: {
        options: { orderBy: { order: "asc" } },
      },
    })

    return NextResponse.json({ message: "تم حفظ مجموعة الخيارات بنجاح", group: updatedGroup })
  } catch (error) {
    console.error("Error saving item option group:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ الخيارات" }, { status: 500 })
  }
}

// DELETE: Delete an option group
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 })
    }

    const { itemId } = await params
    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get("groupId")

    if (!groupId) {
      return NextResponse.json({ error: "معرف المجموعة مطلوب" }, { status: 400 })
    }

    const group = await prisma.itemOptionGroup.findUnique({
      where: { id: groupId },
      include: {
        menuItem: {
          include: {
            category: {
              include: {
                branch: { select: { restaurantId: true } },
              },
            },
          },
        },
      },
    })

    if (!group || !group.menuItem || !group.menuItem.category || !group.menuItem.category.branch) {
      return NextResponse.json({ error: "مجموعة الخيارات غير موجودة" }, { status: 404 })
    }

    const access = await getRestaurantAccess(user.id, group.menuItem.category.branch.restaurantId)
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح لك بحذف هذه الإضافات" }, { status: 403 })
    }

    await prisma.itemOptionGroup.delete({
      where: { id: groupId },
    })

    return NextResponse.json({ message: "تم حذف مجموعة الخيارات بنجاح" })
  } catch (error) {
    console.error("Error deleting option group:", error)
    return NextResponse.json({ error: "حدث خطأ أثناء حذف مجموعة الخيارات" }, { status: 500 })
  }
}
