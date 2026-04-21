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
  id: z.string().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10000).nullish(),
  videoUrl: safeUrlSchema.nullish().or(z.literal("")),
  imageUrl: safeUrlSchema.nullish().or(z.literal("")),
  links: z.string().trim().max(10000).nullish(),
  homework: z.string().trim().max(10000).nullish(),
  theses: z.string().trim().max(20000).nullish(),
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
      lessons: {
        orderBy: { order: "asc" },
        include: {
          files: {
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, size: true, mimeType: true, createdAt: true },
          },
        },
      },
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
      // Сохраняем id существующих уроков: к ним привязаны файлы и прогресс.
      // Delete-then-create сломал бы и то и другое.
      const oldLessons = await prisma.lesson.findMany({
        where: { courseId: id },
        select: { id: true },
      });
      const oldIds = new Set(oldLessons.map((l) => l.id));
      const keptIds = new Set(
        lessons.map((l) => l.id).filter((x): x is string => !!x && oldIds.has(x))
      );
      const toDelete = oldLessons.filter((l) => !keptIds.has(l.id)).map((l) => l.id);

      // Удаляем то, чего нет в новом списке. Прогресс и файлы уйдут каскадом/вручную.
      if (toDelete.length > 0) {
        await prisma.lessonProgress.deleteMany({ where: { lessonId: { in: toDelete } } });
        await prisma.lesson.deleteMany({ where: { id: { in: toDelete } } });
      }

      // Чтобы не упереться в @@unique([courseId, order]) при перестановке,
      // сначала уводим оставшиеся уроки во временные отрицательные order.
      if (keptIds.size > 0) {
        let tmp = -1;
        for (const lid of keptIds) {
          await prisma.lesson.update({ where: { id: lid }, data: { order: tmp-- } });
        }
      }

      // Теперь пишем финальные значения: update для существующих, create для новых.
      for (let i = 0; i < lessons.length; i++) {
        const l = lessons[i];
        const data = {
          title: l.title,
          description: l.description || null,
          videoUrl: l.videoUrl || null,
          imageUrl: l.imageUrl || null,
          order: i + 1,
          links: l.links || null,
          homework: l.homework || null,
          theses: l.theses || null,
          moduleId: l.moduleId ? (moduleMap[l.moduleId] || l.moduleId) : null,
        };
        if (l.id && oldIds.has(l.id)) {
          await prisma.lesson.update({ where: { id: l.id }, data });
        } else {
          await prisma.lesson.create({ data: { ...data, courseId: id } });
        }
      }
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
