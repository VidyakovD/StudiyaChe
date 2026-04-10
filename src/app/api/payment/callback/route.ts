import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Пользователь возвращается сюда после оплаты в ЮKassa
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!courseId || !userId) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Проверяем, создана ли уже покупка (вебхук мог прийти раньше)
  const existing = await prisma.purchase.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!existing) {
    // Покупка ещё не подтверждена вебхуком — создаём
    // В продакшене лучше ждать вебхук, но для тестового режима создаём сразу
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (course) {
      await prisma.purchase.create({
        data: { userId, courseId, amount: course.price },
      });
    }
  }

  // Перенаправляем на страницу курса
  return NextResponse.redirect(new URL(`/course/${courseId}/learn`, req.nextUrl.origin));
}
