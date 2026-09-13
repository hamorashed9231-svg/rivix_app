import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const paymentNumber = await prisma.paymentNumber.findUnique({
      where: { id },
    });

    if (!paymentNumber) {
      return NextResponse.json(
        { error: "لم يتم العثور على رقم الدفع" },
        { status: 404 }
      );
    }

    const access = await getRestaurantAccess(user.id, paymentNumber.restaurantId);
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لتعديل رقم الدفع" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isActive } = body;

    const updated = await prisma.paymentNumber.update({
      where: { id },
      data: {
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating payment number:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعديل رقم الدفع" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const paymentNumber = await prisma.paymentNumber.findUnique({
      where: { id },
    });

    if (!paymentNumber) {
      return NextResponse.json(
        { error: "لم يتم العثور على رقم الدفع" },
        { status: 404 }
      );
    }

    const access = await getRestaurantAccess(user.id, paymentNumber.restaurantId);
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لحذف رقم الدفع" },
        { status: 403 }
      );
    }

    await prisma.paymentNumber.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "تم حذف رقم الدفع بنجاح" });
  } catch (error) {
    console.error("Error deleting payment number:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف رقم الدفع" },
      { status: 500 }
    );
  }
}
