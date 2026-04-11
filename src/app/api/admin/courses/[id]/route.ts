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
      modules: { orderBy: { order: "asc" } },
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
  const { lessons, modules, ...courseData } = body;

  // Update course
  await prisma.course.update({
    where: { id },
    data: courseData,
  });

  // Sync modules: delete old, create new
  const moduleMap: Record<string, string> = {};
  await prisma.lesson.updateMany({ where: { courseId: id }, data: { moduleId: null } });
  await prisma.module.deleteMany({ where: { courseId: id } });
  if (modules && modules.length > 0) {
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i] as Record<string, unknown>;
      const created = await prisma.module.create({
        data: {
          courseId: id,
          title: (m.title as string) || `Модуль ${i + 1}`,
          order: i + 1,
        },
      });
      moduleMap[`new-${i}`] = created.id;
      if (m.id) moduleMap[m.id as string] = created.id;
    }
  }

  // Sync lessons: delete progress, then old lessons, then create new
  if (lessons) {
    const oldLessons = await prisma.lesson.findMany({ where: { courseId: id }, select: { id: true } });
    if (oldLessons.length > 0) {
      await prisma.lessonProgress.deleteMany({ where: { lessonId: { in: oldLessons.map((l) => l.id) } } });
    }
    await prisma.lesson.deleteMany({ where: { courseId: id } });
    await prisma.lesson.createMany({
      data: lessons.map((l: Record<string, unknown>, i: number) => ({
        courseId: id,
        title: l.title as string,
        description: (l.description as string) || null,
        videoUrl: (l.videoUrl as string) || null,
        imageUrl: (l.imageUrl as string) || null,
        order: i + 1,
        links: (l.links as string) || null,
        homework: (l.homework as string) || null,
        moduleId: l.moduleId ? (moduleMap[l.moduleId as string] || (l.moduleId as string)) : null,
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
