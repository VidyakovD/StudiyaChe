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
});

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, registerSchema);
  if (!parsed.ok) return parsed.response;

  const { name, email, password } = parsed.data;

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

    try {
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          verifyToken: hashToken(verifyToken),
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
