import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, z, safeUrlSchema } from "@/lib/validation";

const chatMessageSchema = z
  .object({
    text: z.string().trim().max(4000).optional(),
    imageUrl: safeUrlSchema.optional().or(z.literal("")),
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
