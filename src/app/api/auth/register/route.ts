import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import {
  parseBody,
  z,
  emailSchema,
  passwordSchema,
  nameSchema,
  hashToken,
} from "@/lib/validation";

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

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, registerSchema);
  if (!parsed.ok) return parsed.response;

  const { name, email, password, agreeNewsletter } = parsed.data;

  // Generic-ответ — один и тот же при успехе и при занятом email.
  // Иначе можно перебирать зарегистрированные адреса по разнице 200/409.
  const genericSuccess = NextResponse.json({
    success: true,
    message:
      "Регистрация принята. Если этот email ещё не зарегистрирован, мы отправили письмо для подтверждения.",
  });

  try {
    const hashedPassword = await hash(password, 12);
    const verifyToken = randomUUID();
    const now = new Date();
    // Срок жизни verify-токена: 24 часа. После — нужен ресенд.
    const verifyTokenExp = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          verifyToken: hashToken(verifyToken),
          verifyTokenExp,
          // Фиксируем момент явного согласия — для аудита 152-ФЗ.
          consentToProcessingAt: now,
          subscribedToNewsletter: agreeNewsletter,
        },
      });
    } catch (e: unknown) {
      // P2002 = unique violation (email уже существует или гонка двух запросов).
      // Не раскрываем факт существования — возвращаем тот же generic-ответ.
      if ((e as { code?: string })?.code === "P2002") {
        return genericSuccess;
      }
      throw e;
    }

    // Отправляем письмо верификации (fire-and-forget — не блокирует ответ)
    sendVerificationEmail(email, verifyToken);

    return genericSuccess;
  } catch (error) {
    console.error("[Register] error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
