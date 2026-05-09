import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentJson, baseUrl, checkAgentRateLimit } from "@/lib/agent-api";

// GET /api/agent/lessons/[id]
// Полный контент урока: текст/markdown, видео, материалы, домашка.
//
// Это закрытый эндпоинт за Bearer-токеном. Внешний агент использует его
// для построения ответов пользователям; конечному пользователю прямого
// доступа нет.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = checkAgentRateLimit(req);
  if (limited) return limited;

  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      module: { select: { id: true, title: true, order: true } },
      files: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, filename: true, size: true, mimeType: true, createdAt: true },
      },
    },
  });

  if (!lesson) {
    return agentJson({ error: "Lesson not found" }, { status: 404 });
  }

  // Парсим links из текстового поля в массив строк (по строкам).
  const linksList = (lesson.links || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const base = baseUrl();
  return agentJson({
    lesson: {
      id: lesson.id,
      courseId: lesson.courseId,
      courseTitle: lesson.course?.title ?? null,
      moduleId: lesson.moduleId,
      module: lesson.module,
      title: lesson.title,
      order: lesson.order,
      type: lesson.type,
      url: `${base}/course/${lesson.courseId}/learn`,
      // Контент: в схеме одно поле description — это и есть текст/markdown урока.
      // Отдельного поля content/markdown нет.
      text: lesson.description,
      markdown: lesson.description,
      videoUrl: lesson.videoUrl,
      imageUrl: lesson.imageUrl,
      links: linksList,
      homework: lesson.homework,
      // materials = LessonFile[]. В схеме нет URL для скачивания, поэтому
      // отдаём метаданные (id/имя/размер/MIME). Скачать можно через
      // /api/lesson-file/[id] (но для этого нужна купившая сессия — не агентский путь).
      materials: lesson.files.map((f) => ({
        id: f.id,
        name: f.name,
        filename: f.filename,
        size: f.size,
        mimeType: f.mimeType,
        createdAt: f.createdAt.toISOString(),
      })),
      // В схеме нет updatedAt — отдаём null.
      updatedAt: null as string | null,
    },
  });
}
