import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import {
  LESSON_FILES_DIR,
  LESSON_FILE_MAX_SIZE,
  LESSON_FILE_ALLOWED_MIME,
  safeExtension,
} from "@/lib/lesson-files";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const lessonId = formData.get("lessonId");
  const customName = formData.get("name");

  if (!file) {
    return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
  }
  if (typeof lessonId !== "string" || lessonId.length === 0 || lessonId.length > 64) {
    return NextResponse.json({ error: "Некорректный lessonId" }, { status: 400 });
  }

  if (file.size > LESSON_FILE_MAX_SIZE) {
    return NextResponse.json(
      { error: "Максимальный размер файла — 30 МБ" },
      { status: 400 }
    );
  }
  if (!LESSON_FILE_ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Тип файла "${file.type || "неизвестен"}" не разрешён` },
      { status: 400 }
    );
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await mkdir(LESSON_FILES_DIR, { recursive: true });

  const ext = safeExtension(file.name);
  const storedFilename = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  const fullPath = path.join(LESSON_FILES_DIR, storedFilename);

  await writeFile(fullPath, buffer);

  const displayName =
    typeof customName === "string" && customName.trim().length > 0
      ? customName.trim().slice(0, 200)
      : file.name.slice(0, 200);

  const record = await prisma.lessonFile.create({
    data: {
      lessonId,
      name: displayName,
      filename: storedFilename,
      size: file.size,
      mimeType: file.type,
    },
    select: { id: true, name: true, size: true, mimeType: true, createdAt: true },
  });

  return NextResponse.json(record);
}
