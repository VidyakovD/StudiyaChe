import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Пользователь возвращается сюда после оплаты в ЮKassa
// БЕЗОПАСНОСТЬ: НЕ создаём покупку здесь — только проверяем.
// Покупка создаётся ТОЛЬКО в webhook после верификации через API ЮКассы.
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("courseId");
  const baseUrl = process.env.NEXTAUTH_URL || "https://studiache.ru";

  if (!courseId) {
    return NextResponse.redirect(`${baseUrl}/`);
  }

  // Ждём до 10 секунд пока webhook создаст покупку
  // (webhook обычно приходит быстрее чем пользователь вернётся)
  let purchased = false;
  const userId = req.nextUrl.searchParams.get("userId");

  if (userId) {
    for (let i = 0; i < 5; i++) {
      const existing = await prisma.purchase.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (existing) {
        purchased = true;
        break;
      }
      // Ждём 2 секунды перед следующей проверкой
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  if (purchased) {
    return NextResponse.redirect(`${baseUrl}/course/${courseId}/learn`);
  }

  // Если покупка ещё не подтверждена — редирект на страницу курса
  // (webhook придёт позже и покупка появится)
  return NextResponse.redirect(`${baseUrl}/course/${courseId}?payment=processing`);
}
