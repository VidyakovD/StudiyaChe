import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const courses = await prisma.course.findMany({
    include: {
      category: true,
      _count: { select: { purchases: true, lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { lessons, modules, ...courseData } = body;

  // Create course
  const course = await prisma.course.create({ data: courseData });

  // Create modules
  const moduleMap: Record<string, string> = {};
  if (modules && modules.length > 0) {
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i] as Record<string, unknown>;
      const created = await prisma.module.create({
        data: {
          courseId: course.id,
          title: (m.title as string) || `Модуль ${i + 1}`,
          order: i + 1,
        },
      });
      moduleMap[`new-${i}`] = created.id;
      if (m.id) moduleMap[m.id as string] = created.id;
    }
  }

  // Create lessons
  if (lessons && lessons.length > 0) {
    await prisma.lesson.createMany({
      data: (lessons as Record<string, unknown>[]).map((l, i) => ({
        courseId: course.id,
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

  return NextResponse.json({ course });
}
