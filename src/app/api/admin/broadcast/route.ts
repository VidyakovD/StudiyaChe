import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBroadcastEmail } from "@/lib/email";
import { parseBody, z } from "@/lib/validation";

const broadcastSchema = z.object({
  subject: z.string().trim().min(1, "Тема обязательна").max(200),
  message: z.string().trim().min(1, "Текст обязателен").max(20000),
});

// POST — отправить рассылку всем зарегистрированным пользователям
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const parsed = await parseBody(req, broadcastSchema);
  if (!parsed.ok) return parsed.response;
  const { subject, message } = parsed.data;

  try {
    // Получить всех верифицированных пользователей
    const users = await prisma.user.findMany({
      where: { emailVerified: true },
      select: { email: true, name: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "Нет подтверждённых пользователей для рассылки" }, { status: 400 });
    }

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
  } catch (error) {
    console.error("[Broadcast] error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
