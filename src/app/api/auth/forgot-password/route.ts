import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Введите email" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Всегда отвечаем успехом (чтобы не раскрывать существование аккаунта)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.",
      });
    }

    const resetToken = randomUUID();
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    // Fire-and-forget — не блокирует ответ
    sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({
      success: true,
      message: "Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля.",
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
