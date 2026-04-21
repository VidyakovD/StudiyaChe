import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { parseBody, z, nameSchema, passwordSchema, safeUrlSchema } from "@/lib/validation";

const profileSchema = z.object({
  name: nameSchema.optional(),
  nickname: z.string().trim().max(50).optional().nullable(),
  avatarUrl: safeUrlSchema.optional().nullable().or(z.literal("")),
  password: passwordSchema.optional(),
  currentPassword: z.string().max(128).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const parsed = await parseBody(req, profileSchema);
  if (!parsed.ok) return parsed.response;
  const { name, password, currentPassword, nickname, avatarUrl } = parsed.data;

  try {
    const updateData: Record<string, string | null> = {};
    if (name) updateData.name = name;

    // Смена пароля — требует старый пароль
    if (password) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Введите текущий пароль" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user) {
        return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Неверный текущий пароль" }, { status: 403 });
      }

      updateData.password = await bcrypt.hash(password, 12);
    }

    if (nickname !== undefined) updateData.nickname = nickname || null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        nickname: true,
        avatarUrl: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[Profile] update error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
