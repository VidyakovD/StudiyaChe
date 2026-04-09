import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalCourses, totalPurchases, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.purchase.count(),
    prisma.purchase.aggregate({ _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalCourses,
    totalPurchases,
    totalRevenue: revenue._sum.amount || 0,
  });
}
