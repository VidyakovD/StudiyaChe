import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import {
  parseBody,
  z,
  emailSchema,
  passwordSchema,
  nameSchema,
} from "@/lib/validation";
import { signRegistrationToken } from "@/lib/registration-token";

const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  // Оба согласия обязательны для регистрации (152-ФЗ + наша оферта).
  agreeOffer: z.literal(true, { message: "Необходимо принять условия оферты" }),
  agreePrivacy: z.literal(true, {
    message: "Необходимо согласие на обработку персональных данных",
  }),
  // Маркетинговое — опциональное (38-ФЗ требует явного согласия, default false).
  agreeNewsletter: z.boolean().optional().default(false),
});

// POST /api/auth/register — НЕ создаёт User в БД.
// Подписанный токен с email/именем/bcrypt-hash пароля кладётся в URL письма.
// User создаётся ТОЛЬКО при verify (после клика в письме).
// Так незаконченные регистрации не оседают в БД и нет email-enumeration.
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, registerSchema);
  if (!parsed.ok) return parsed.response;

  const { name, email, password, agreeNewsletter } = parsed.data;

  // Generic-ответ — один и тот же при успехе, при занятом email и при ошибке
  // отправки письма. Так невозможно перебрать существующие email-ы.
  const genericSuccess = NextResponse.json({
    success: true,
    message:
      "Регистрация принята. Если этот email ещё не зарегистрирован, мы отправили письмо для подтверждения. Ссылка действительна 24 часа.",
  });

  try {
    // Проверка существования НЕ блокирует ответ (генерик), но письмо тогда
    // не шлём — иначе можно было бы DOS-ить чужой инбокс.
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });
    if (existing) {
      // Эта ветка не отдаёт сигнал клиенту — просто молчаливо не шлём письмо.
      // Юзер с уже существующим email видит то же сообщение, что и новый.
      return genericSuccess;
    }

    const passwordHash = await hash(password, 12);
    const token = signRegistrationToken({
      email,
      passwordHash,
      name,
      agreeNewsletter,
      consentAt: Date.now(),
    });

    sendVerificationEmail(email, token);
    return genericSuccess;
  } catch (error) {
    console.error("[Register] error:", (error as { code?: string })?.code || "unknown");
    // Тоже generic — не палим, был сбой или нет.
    return genericSuccess;
  }
}
