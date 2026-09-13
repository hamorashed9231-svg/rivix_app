import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        branch: {
          select: { restaurantId: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "لم يتم العثور على الطلب" },
        { status: 404 }
      );
    }

    const access = await getRestaurantAccess(user.id, order.branch.restaurantId);
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لمراجعة مدفوعات هذا الطلب" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentStatus } = body;

    if (paymentStatus !== "verified" && paymentStatus !== "rejected") {
      return NextResponse.json(
        { error: "حالة الدفع يجب أن تكون verified أو rejected" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order payment status:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة الدفع" },
      { status: 500 }
    );
  }
}
