import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Пользователь возвращается сюда после оплаты в ЮKassa
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  const userId = req.nextUrl.searchParams.get("userId");

  const baseUrl = process.env.NEXTAUTH_URL || "https://studiache.ru";

  if (!courseId || !userId) {
    return NextResponse.redirect(`${baseUrl}/`);
  }

  // Проверяем, создана ли уже покупка (вебхук мог прийти раньше)
  const existing = await prisma.purchase.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!existing) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (course) {
      await prisma.purchase.create({
        data: { userId, courseId, amount: course.price },
      });
    }
  }

  return NextResponse.redirect(`${baseUrl}/course/${courseId}/learn`);
}
