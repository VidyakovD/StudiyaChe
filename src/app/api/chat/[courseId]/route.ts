import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyPurchase(userId: string, courseId: string) {
  const purchase = await prisma.purchase.findFirst({
    where: { userId, courseId },
  });
  return !!purchase;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { courseId } = await params;

    const hasPurchased = await verifyPurchase(session.user.id, courseId);
    if (!hasPurchased) {
      return NextResponse.json(
        { error: "Курс не приобретён" },
        { status: 403 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { courseId },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { courseId } = await params;

    const hasPurchased = await verifyPurchase(session.user.id, courseId);
    if (!hasPurchased) {
      return NextResponse.json(
        { error: "Курс не приобретён" },
        { status: 403 }
      );
    }

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
          select: { id: true, name: true, nickname: true, avatarUrl: true },
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
