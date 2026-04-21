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
  theses: z.string().trim().max(20000).nullish(),
  moduleId: z.string().nullish(),
});

const courseCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  price: z.number().finite().min(0).max(10_000_000),
  videoUrl: safeUrlSchema.nullish().or(z.literal("")),
  imageUrl: safeUrlSchema.nullish().or(z.literal("")),
  categoryId: z.string().trim().min(1).max(64),
  recommendedCourseId: z.string().trim().max(64).nullish(),
  discountPercent: z.number().int().min(0).max(100).nullish(),
  modules: z.array(moduleInputSchema).max(100).optional(),
  lessons: z.array(lessonInputSchema).max(500).optional(),
});

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

  const parsed = await parseBody(req, courseCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { lessons, modules, ...courseData } = parsed.data;

  try {
    const course = await prisma.course.create({ data: courseData });

    const moduleMap: Record<string, string> = {};
    if (modules && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const created = await prisma.module.create({
          data: {
            courseId: course.id,
            title: m.title || `Модуль ${i + 1}`,
            order: i + 1,
          },
        });
        moduleMap[`new-${i}`] = created.id;
        if (m.id) moduleMap[m.id] = created.id;
      }
    }

    if (lessons && lessons.length > 0) {
      await prisma.lesson.createMany({
        data: lessons.map((l, i) => ({
          courseId: course.id,
          title: l.title,
          description: l.description || null,
          videoUrl: l.videoUrl || null,
          imageUrl: l.imageUrl || null,
          order: i + 1,
          links: l.links || null,
          homework: l.homework || null,
          theses: l.theses || null,
          moduleId: l.moduleId ? (moduleMap[l.moduleId] || l.moduleId) : null,
        })),
      });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("[Admin] Create course error:", error);
    return NextResponse.json({ error: "Ошибка создания курса" }, { status: 500 });
  }
}
