import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const { courseId } = await params;

    // Берём последние 500 — старше админу не нужно листать в одном запросе.
    const recent = await prisma.chatMessage.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        user: {
          select: { id: true, name: true, nickname: true, avatarUrl: true, role: true },
        },
      },
    });
    const messages = recent.reverse();

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const { courseId } = await params;
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Текст сообщения обязателен" },
        { status: 400 }
      );
    }
    // Тот же лимит, что у пользовательского чата — иначе админ-сессия
    // (или скомпрометированная) могла бы класть мегабайтный текст в БД.
    if (text.length > 4000) {
      return NextResponse.json(
        { error: "Сообщение слишком длинное (макс. 4000 символов)" },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        courseId,
        userId: session.user.id,
        text: text.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, nickname: true, avatarUrl: true, role: true },
        },
      },
    });

    return NextResponse.json(message);
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
