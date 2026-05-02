import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, z } from "@/lib/validation";

// imageUrl — только наши аплоады /uploads/... Внешние https://-картинки давали
// бы возможность подсовывать трекинг-пиксели на чужой домен и деанонить читателей.
const chatImageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || v.startsWith("/uploads/"), {
    message: "Допускаются только загруженные на платформу изображения",
  });

const chatMessageSchema = z
  .object({
    text: z.string().trim().max(4000).optional(),
    imageUrl: chatImageUrlSchema.optional(),
  })
  .refine((v) => (v.text && v.text.length > 0) || (v.imageUrl && v.imageUrl.length > 0), {
    message: "Текст или изображение обязательны",
  });

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

    // Берём 100 последних, потом разворачиваем в хронологический порядок.
    // Раньше брались "первые 100 по asc" — после 100 сообщений новые не показывались.
    const recent = await prisma.chatMessage.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
      },
    });
    const messages = recent.reverse();

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

    const parsed = await parseBody(req, chatMessageSchema);
    if (!parsed.ok) return parsed.response;
    const { text, imageUrl } = parsed.data;

    const message = await prisma.chatMessage.create({
      data: {
        courseId,
        userId: session.user.id,
        text: text || "",
        imageUrl: imageUrl || null,
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
