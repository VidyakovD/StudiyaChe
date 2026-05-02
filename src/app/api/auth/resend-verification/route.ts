import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { parseBody, z, emailSchema, hashToken } from "@/lib/validation";

const resendSchema = z.object({
  email: emailSchema,
});

// Перевыпустить письмо подтверждения email.
// Generic-ответ — не раскрываем существование/статус аккаунта.
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, resendSchema);
  if (!parsed.ok) return parsed.response;

  const { email } = parsed.data;

  const generic = NextResponse.json({
    success: true,
    message: "Если email зарегистрирован и не подтверждён, мы отправили письмо повторно.",
  });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      return generic;
    }

    const verifyToken = randomUUID();
    const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken: hashToken(verifyToken), verifyTokenExp },
    });

    sendVerificationEmail(email, verifyToken);
    return generic;
  } catch (error) {
    console.error("[ResendVerification] error:", error);
    // Чтобы не давать сигнал на enumeration через 500 — отвечаем тем же generic.
    return generic;
  }
}
