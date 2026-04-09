import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lessons: { orderBy: { order: "asc" } },
      category: true,
    },
  });

  return NextResponse.json({ course });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { lessons, ...courseData } = body;

  // Update course
  await prisma.course.update({
    where: { id },
    data: courseData,
  });

  // Sync lessons: delete old and create new
  if (lessons) {
    await prisma.lesson.deleteMany({ where: { courseId: id } });
    await prisma.lesson.createMany({
      data: lessons.map((l: Record<string, unknown>, i: number) => ({
        courseId: id,
        title: l.title as string,
        description: (l.description as string) || null,
        videoUrl: (l.videoUrl as string) || null,
        order: i + 1,
        links: (l.links as string) || null,
        homework: (l.homework as string) || null,
      })),
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.course.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
