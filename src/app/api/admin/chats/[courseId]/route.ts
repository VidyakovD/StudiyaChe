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

    const messages = await prisma.chatMessage.findMany({
      where: { courseId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, nickname: true, avatarUrl: true, role: true },
        },
      },
    });

    return NextResponse.json(messages);
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
