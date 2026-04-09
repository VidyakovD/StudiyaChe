import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      where: {
        chatMessages: { some: {} },
      },
      select: {
        id: true,
        title: true,
        chatMessages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            text: true,
            createdAt: true,
          },
        },
        _count: {
          select: { chatMessages: true },
        },
      },
    });

    const result = courses
      .map((course) => ({
        id: course.id,
        title: course.title,
        lastMessage: course.chatMessages[0]?.text ?? null,
        lastMessageAt: course.chatMessages[0]?.createdAt ?? null,
        messageCount: course._count.chatMessages,
      }))
      .sort((a, b) => {
        if (!a.lastMessageAt || !b.lastMessageAt) return 0;
        return (
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
        );
      });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
