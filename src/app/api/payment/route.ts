import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Необходимо авторизоваться", redirect: "/auth/login" },
      { status: 401 }
    );
  }

  const { courseId } = await req.json();

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
  }

  const existing = await prisma.purchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Курс уже куплен" }, { status: 409 });
  }

  // Stub: in production, create YuKassa payment and return confirmation URL
  // For now, create purchase directly
  await prisma.purchase.create({
    data: {
      userId: session.user.id,
      courseId,
      amount: course.price,
    },
  });

  return NextResponse.json({ success: true });
}
