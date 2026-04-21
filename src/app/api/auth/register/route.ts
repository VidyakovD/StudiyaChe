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

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);
    const verifyToken = randomUUID();

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verifyToken: hashToken(verifyToken),
      },
    });

    // Отправляем письмо верификации (fire-and-forget — не блокирует ответ)
    sendVerificationEmail(email, verifyToken);

    return NextResponse.json({
      success: true,
      message: "Регистрация успешна! Проверьте вашу почту для подтверждения email.",
    });
  } catch (error) {
    console.error("[Register] error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
