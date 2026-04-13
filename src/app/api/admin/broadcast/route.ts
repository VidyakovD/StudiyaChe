import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBroadcastEmail } from "@/lib/email";

// POST — отправить рассылку всем зарегистрированным пользователям
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { subject, message } = await req.json();

  if (!subject || !message) {
    return NextResponse.json({ error: "Тема и текст обязательны" }, { status: 400 });
  }

  // Получить всех верифицированных пользователей
  const users = await prisma.user.findMany({
    where: { emailVerified: true },
    select: { email: true, name: true },
  });

  if (users.length === 0) {
    return NextResponse.json({ error: "Нет подтверждённых пользователей для рассылки" }, { status: 400 });
  }

  // Отправка всем (fire-and-forget для каждого)
  let sent = 0;
  for (const user of users) {
    sendBroadcastEmail(user.email, user.name || "Студент", subject, message);
    sent++;
  }

  return NextResponse.json({
    success: true,
    message: `Рассылка запущена: ${sent} получателей`,
    totalRecipients: sent,
  });
}
