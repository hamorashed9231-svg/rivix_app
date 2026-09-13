import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getRestaurantAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const user = await getCurrentUser();

    let isAuthorizedStaff = false;

    if (user) {
      const access = await getRestaurantAccess(user.id, restaurantId);
      if (access === "owner" || access === "manager" || user.role === "admin") {
        isAuthorizedStaff = true;
      }
    }

    const paymentNumbers = await prisma.paymentNumber.findMany({
      where: {
        restaurantId,
        ...(isAuthorizedStaff ? {} : { isActive: true }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(paymentNumbers);
  } catch (error) {
    console.error("Error fetching payment numbers:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب أرقام الدفع" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const access = await getRestaurantAccess(user.id, restaurantId);
    if (access !== "owner" && access !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لإضافة أرقام الدفع" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { label, type, number } = body;

    if (!label || !type || !number) {
      return NextResponse.json(
        { error: "جميع الحقول (التسمية، النوع، الرقم) مطلوبة" },
        { status: 400 }
      );
    }

    if (type !== "vodafone_cash" && type !== "instapay") {
      return NextResponse.json(
        { error: "نوع التحويل غير مدعوم" },
        { status: 400 }
      );
    }

    const newPaymentNumber = await prisma.paymentNumber.create({
      data: {
        restaurantId,
        label: label.trim(),
        type,
        number: number.trim(),
        isActive: true,
      },
    });

    return NextResponse.json(newPaymentNumber, { status: 201 });
  } catch (error) {
    console.error("Error creating payment number:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة رقم الدفع" },
      { status: 500 }
    );
  }
}
