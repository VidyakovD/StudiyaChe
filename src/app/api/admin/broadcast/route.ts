import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBroadcastEmailAsync } from "@/lib/email";
import { parseBody, z } from "@/lib/validation";

const broadcastSchema = z.object({
  subject: z.string().trim().min(1, "Тема обязательна").max(200),
  message: z.string().trim().min(1, "Текст обязателен").max(20000),
});

// Параллельная отправка пачками — иначе на 1000+ пользователях SMTP-провайдер банит.
const BROADCAST_CONCURRENCY = 5;

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
    // 38-ФЗ "О рекламе": маркетинговую рассылку шлём только тем, кто явно
    // согласился (отдельный чекбокс при регистрации). Без подписки — даже
    // подтверждённый аккаунт в рассылку не попадает.
    const users = await prisma.user.findMany({
      where: { emailVerified: true, subscribedToNewsletter: true },
      select: { email: true, name: true },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Нет пользователей, подписанных на рассылку" },
        { status: 400 }
      );
    }

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < users.length; i += BROADCAST_CONCURRENCY) {
      const batch = users.slice(i, i + BROADCAST_CONCURRENCY);
      const results = await Promise.all(
        batch.map((u) => sendBroadcastEmailAsync(u.email, u.name || "Студент", subject, message))
      );
      for (const ok of results) {
        if (ok) sent++;
        else failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Рассылка завершена: ${sent} отправлено, ${failed} с ошибкой`,
      sent,
      failed,
      totalRecipients: users.length,
    });
  } catch (error) {
    console.error("[Broadcast] error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
