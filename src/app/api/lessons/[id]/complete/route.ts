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
