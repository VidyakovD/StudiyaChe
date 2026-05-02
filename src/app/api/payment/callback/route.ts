import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

  // userId берём ТОЛЬКО из сессии. Раньше он шёл в URL, что давало
  // утечку идентификатора и возможность подменить чужой userId.
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.redirect(`${baseUrl}/auth/login?next=/course/${courseId}`);
  }

  // Ждём до 10 секунд пока webhook создаст покупку.
  let purchased = false;
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.purchase.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      purchased = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (purchased) {
    return NextResponse.redirect(`${baseUrl}/course/${courseId}/learn`);
  }

  // webhook ещё не пришёл — отправляем на страницу курса
  return NextResponse.redirect(`${baseUrl}/course/${courseId}?payment=processing`);
}
