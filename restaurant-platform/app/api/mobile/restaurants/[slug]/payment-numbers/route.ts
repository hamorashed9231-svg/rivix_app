import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "لم يتم العثور على المطعم" },
        { status: 404 }
      );
    }

    const paymentNumbers = await prisma.paymentNumber.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
      },
      select: {
        id: true,
        label: true,
        type: true,
        number: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(paymentNumbers);
  } catch (error) {
    console.error("Error fetching mobile payment numbers:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب أرقام الدفع" },
      { status: 500 }
    );
  }
}
