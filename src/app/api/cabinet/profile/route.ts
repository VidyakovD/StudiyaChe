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
  // Управление подпиской на маркетинговую рассылку (38-ФЗ).
  subscribedToNewsletter: z.boolean().optional(),
});

const deleteAccountSchema = z.object({
  // Подтверждение пароля — обязательно: удаление аккаунта необратимо.
  currentPassword: z.string().min(1).max(128),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const parsed = await parseBody(req, profileSchema);
  if (!parsed.ok) return parsed.response;
  const { name, password, currentPassword, nickname, avatarUrl, subscribedToNewsletter } = parsed.data;

  try {
    const updateData: Record<string, string | boolean | null> = {};
    if (name) updateData.name = name;
    if (typeof subscribedToNewsletter === "boolean") {
      updateData.subscribedToNewsletter = subscribedToNewsletter;
    }

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
        subscribedToNewsletter: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[Profile] update error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// GET — отдаёт текущий профиль (нужен UI кабинета, чтобы показать актуальный
// флаг рассылки и т.п.).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      nickname: true,
      avatarUrl: true,
      role: true,
      subscribedToNewsletter: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Не найден" }, { status: 404 });
  return NextResponse.json(user);
}

// DELETE — реализация права субъекта ПДн на удаление (ст. 14, ст. 21 152-ФЗ).
// Требует подтверждение паролем. Удаляет:
//   - связанные LessonProgress
//   - сообщения юзера в чатах курсов
//   - сами Purchase (FK к User не cascade — чистим вручную)
//   - User
// Админа не даём удалить через этот эндпоинт — он должен править ВРУЧНУЮ при необходимости.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }
  if (session.user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Аккаунт администратора удаляется только владельцем платформы вручную" },
      { status: 403 }
    );
  }

  const parsed = await parseBody(req, deleteAccountSchema);
  if (!parsed.ok) return parsed.response;
  const { currentPassword } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Аккаунт администратора удаляется только владельцем платформы вручную" },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 403 });
    }

    // Атомарно — иначе можно остаться в полу-удалённом состоянии.
    await prisma.$transaction(async (tx) => {
      await tx.lessonProgress.deleteMany({ where: { userId: user.id } });
      await tx.chatMessage.deleteMany({ where: { userId: user.id } });
      await tx.purchase.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Profile] delete error:", (error as { code?: string })?.code || "unknown");
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
