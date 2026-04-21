import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseBody, z, passwordSchema, hashToken } from "@/lib/validation";

const resetSchema = z.object({
  token: z.string().trim().min(10).max(256),
  password: passwordSchema,
});

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, resetSchema);
  if (!parsed.ok) return parsed.response;

  const { token, password } = parsed.data;

  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: hashToken(token) },
    });

    if (!user) {
      return NextResponse.json({ error: "Недействительная ссылка для сброса пароля" }, { status: 400 });
    }

    if (user.resetTokenExp && user.resetTokenExp < new Date()) {
      return NextResponse.json({ error: "Ссылка для сброса пароля истекла. Запросите новую." }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Пароль успешно изменён. Теперь можешь войти с новым паролем.",
    });
  } catch (error) {
    console.error("[ResetPassword] error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
