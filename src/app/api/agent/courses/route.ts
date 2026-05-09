import { prisma } from "@/lib/prisma";
import { agentJson, baseUrl, tagsForCourse } from "@/lib/agent-api";

// GET /api/agent/courses
// Все опубликованные курсы. В текущей схеме отдельного флага "published" нет —
// в каталог идут все Course'ы, поэтому отдаём все.
export async function GET() {
  const courses = await prisma.course.findMany({
    include: {
      category: { select: { name: true, slug: true } },
      _count: { select: { lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const base = baseUrl();
  const items = courses.map((c) => ({
    id: c.id,
    // slug отдельного поля у курса нет — отдаём slug категории как ближайший
    // суррогат. Для стабильного slug курса нужно поле в схеме (см. отчёт).
    slug: c.category?.slug ?? null,
    name: c.title,
    shortName: null as string | null, // нет в схеме
    price: c.price,
    currency: "RUB",
    level: null as string | null, // нет в схеме
    url: `${base}/course/${c.id}`,
    description: c.description,
    lessonsCount: c._count.lessons,
    audience: null as string | null, // нет в схеме
    tags: tagsForCourse(c.category),
    // updatedAt в схеме нет — отдаём createdAt как ближайший аналог.
    updatedAt: c.createdAt.toISOString(),
  }));

  return agentJson({ courses: items, count: items.length });
}
