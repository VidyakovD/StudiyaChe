import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id: lessonId } = await params;

  // Проверяем что пользователь купил курс, к которому принадлежит этот урок
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }

  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: lesson.courseId,
      },
    },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Курс не куплен" }, { status: 403 });
  }

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: { userId: session.user.id, lessonId },
    },
    update: { completed: true, completedAt: new Date() },
    create: {
      userId: session.user.id,
      lessonId,
      completed: true,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
