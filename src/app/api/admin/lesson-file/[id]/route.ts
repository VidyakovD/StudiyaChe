import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { LESSON_FILES_DIR } from "@/lib/lesson-files";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const file = await prisma.lessonFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  // Удаляем физический файл, игнорируя ошибку — БД запись удалим в любом случае
  try {
    const fullPath = path.join(LESSON_FILES_DIR, path.basename(file.filename));
    await unlink(fullPath);
  } catch (err) {
    console.warn("[LessonFile] unlink failed:", err);
  }

  await prisma.lessonFile.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
