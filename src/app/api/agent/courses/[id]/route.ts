import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentJson, baseUrl, tagsForCourse, checkAgentRateLimit } from "@/lib/agent-api";

// GET /api/agent/courses/[id]
// Детали курса + массив уроков (только мета: id/title/order/type, без видео и
// без homework — за полным контентом идём в /api/agent/lessons/[id]).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = checkAgentRateLimit(req);
  if (limited) return limited;

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      modules: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true } },
      lessons: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          type: true,
          moduleId: true,
        },
      },
      _count: { select: { lessons: true } },
    },
  });

  if (!course) {
    return agentJson({ error: "Course not found" }, { status: 404 });
  }

  const base = baseUrl();
  return agentJson({
    course: {
      id: course.id,
      slug: course.category?.slug ?? null,
      name: course.title,
      shortName: null, // нет в схеме
      price: course.price,
      currency: "RUB",
      level: null, // нет в схеме
      url: `${base}/course/${course.id}`,
      description: course.description,
      // fullDescription нет — описание у нас одно. Возвращаем его же.
      fullDescription: course.description,
      lessonsCount: course._count.lessons,
      audience: null, // нет в схеме
      tags: tagsForCourse(course.category),
      updatedAt: course.createdAt.toISOString(),
      modules: course.modules,
      lessons: course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.order,
        type: l.type, // LESSON / MASTERCLASS
        moduleId: l.moduleId,
        // duration нет в схеме — отдаём null.
        duration: null as number | null,
        // isFree нет в схеме (доступ управляется фактом покупки курса). Отдаём false.
        isFree: false,
      })),
    },
  });
}
