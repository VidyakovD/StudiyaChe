import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import { LESSON_FILES_DIR } from "@/lib/lesson-files";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;

  const file = await prisma.lessonFile.findUnique({
    where: { id },
    include: { lesson: { select: { courseId: true } } },
  });
  if (!file) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  // Админ может качать всё. Обычный пользователь — только если купил курс,
  // к которому относится урок с этим файлом.
  if (session.user.role !== "ADMIN") {
    const purchase = await prisma.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: file.lesson.courseId,
        },
      },
      select: { id: true },
    });
    if (!purchase) {
      return NextResponse.json({ error: "Курс не приобретён" }, { status: 403 });
    }
  }

  const fullPath = path.join(LESSON_FILES_DIR, path.basename(file.filename));
  let buffer: Buffer;
  try {
    buffer = await readFile(fullPath);
  } catch (err) {
    console.error("[LessonFile] readFile failed:", err);
    return NextResponse.json({ error: "Файл недоступен" }, { status: 500 });
  }

  // Content-Disposition: attachment — браузер качает, а не открывает как HTML.
  // RFC 5987 filename* для юникодных имён.
  const asciiFallback = file.name.replace(/[^\x20-\x7E]+/g, "_") || "file";
  const encoded = encodeURIComponent(file.name);

  const body = new Uint8Array(buffer);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store",
    },
  });
}
