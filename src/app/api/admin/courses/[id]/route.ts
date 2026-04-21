import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, z, safeUrlSchema } from "@/lib/validation";

const moduleInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().max(200).optional(),
});

const lessonInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10000).nullish(),
  videoUrl: safeUrlSchema.nullish().or(z.literal("")),
  imageUrl: safeUrlSchema.nullish().or(z.literal("")),
  links: z.string().trim().max(10000).nullish(),
  homework: z.string().trim().max(10000).nullish(),
  moduleId: z.string().nullish(),
});

const courseUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  price: z.number().finite().min(0).max(10_000_000).optional(),
  videoUrl: safeUrlSchema.nullish().or(z.literal("")),
  imageUrl: safeUrlSchema.nullish().or(z.literal("")),
  categoryId: z.string().trim().min(1).max(64).optional(),
  recommendedCourseId: z.string().trim().max(64).nullish(),
  discountPercent: z.number().int().min(0).max(100).nullish(),
  modules: z.array(moduleInputSchema).max(100).optional(),
  lessons: z.array(lessonInputSchema).max(500).optional(),
});

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
  const parsed = await parseBody(req, courseUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { lessons, modules, ...courseData } = parsed.data;

  try {
    await prisma.course.update({
      where: { id },
      data: courseData,
    });

    const moduleMap: Record<string, string> = {};
    await prisma.lesson.updateMany({ where: { courseId: id }, data: { moduleId: null } });
    await prisma.module.deleteMany({ where: { courseId: id } });
    if (modules && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const created = await prisma.module.create({
          data: {
            courseId: id,
            title: m.title || `Модуль ${i + 1}`,
            order: i + 1,
          },
        });
        moduleMap[`new-${i}`] = created.id;
        if (m.id) moduleMap[m.id] = created.id;
      }
    }

    if (lessons) {
      const oldLessons = await prisma.lesson.findMany({ where: { courseId: id }, select: { id: true } });
      if (oldLessons.length > 0) {
        await prisma.lessonProgress.deleteMany({ where: { lessonId: { in: oldLessons.map((l) => l.id) } } });
      }
      await prisma.lesson.deleteMany({ where: { courseId: id } });
      await prisma.lesson.createMany({
        data: lessons.map((l, i) => ({
          courseId: id,
          title: l.title,
          description: l.description || null,
          videoUrl: l.videoUrl || null,
          imageUrl: l.imageUrl || null,
          order: i + 1,
          links: l.links || null,
          homework: l.homework || null,
          moduleId: l.moduleId ? (moduleMap[l.moduleId] || l.moduleId) : null,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin] Update course error:", error);
    return NextResponse.json({ error: "Ошибка обновления курса" }, { status: 500 });
  }
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

  try {
    const lessons = await prisma.lesson.findMany({ where: { courseId: id }, select: { id: true } });
    const lessonIds = lessons.map(l => l.id);
    if (lessonIds.length > 0) {
      await prisma.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } });
    }

    await prisma.chatMessage.deleteMany({ where: { courseId: id } });
    await prisma.purchase.deleteMany({ where: { courseId: id } });

    await prisma.course.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Admin] Delete course error:", e);
    return NextResponse.json({ error: "Ошибка удаления курса" }, { status: 500 });
  }
}
