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
      include: {
        branches: {
          select: {
            id: true,
            address: true,
            phone: true,
            lat: true,
            lng: true,
            openingHours: true,
            isActive: true,
            deliveryEnabled: true,
            deliveryRadiusKm: true,
            pricePerKm: true,
            baseDeliveryFee: true,
            minOrderForDelivery: true,
          },
        },
        menuCategories: {
          orderBy: { order: "asc" },
          include: {
            items: {
              where: { isAvailable: true },
              include: {
                branchItems: true,
                optionGroups: {
                  include: {
                    options: {
                      orderBy: { order: "asc" },
                    },
                  },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!restaurant || restaurant.status !== "active") {
      return NextResponse.json(
        { error: "لم يتم العثور على المطعم أو أن الحساب غير نشط حالياً" },
        { status: 404 }
      );
    }

    const defaultBranch = restaurant.branches[0];

    const categories = restaurant.menuCategories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        items: cat.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          originalPrice: item.originalPrice,
          image: item.image,
          isAvailable: item.isAvailable,
          optionGroups: item.optionGroups,
        })),
      }))
      .filter((cat) => cat.items.length > 0);

    const allItems = categories.flatMap((cat) => cat.items);

    return NextResponse.json({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      logo: restaurant.logo,
      coverImage: restaurant.coverImage,
      description: restaurant.description,
      primaryColor: restaurant.primaryColor || "#f37f20",
      secondaryColor: restaurant.secondaryColor || "#b18168",
      phone: defaultBranch?.phone || "",
      address: defaultBranch?.address || "",
      branches: restaurant.branches,
      categories: categories,
      menu: allItems,
    });
  } catch (error) {
    console.error("Error fetching mobile restaurant by slug:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات المطعم" },
      { status: 500 }
    );
  }
}
