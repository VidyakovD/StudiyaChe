import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";

// Определяем реальный тип файла по magic bytes, а не по MIME из заголовка.
// MIME можно подделать — magic bytes подделать нельзя без модификации содержимого.
function detectImageType(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  // GIF87a / GIF89a
  if (buf.slice(0, 6).toString("ascii") === "GIF87a" || buf.slice(0, 6).toString("ascii") === "GIF89a") {
    return { ext: "gif", mime: "image/gif" };
  }
  // WEBP: "RIFF....WEBP"
  if (
    buf.slice(0, 4).toString("ascii") === "RIFF" &&
    buf.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }

  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
  }

  // Max 5MB (проверяем до чтения содержимого)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Максимальный размер файла — 5 МБ" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Проверяем реальный тип содержимого — не MIME.
  const detected = detectImageType(buffer);
  if (!detected) {
    return NextResponse.json(
      { error: "Разрешены только изображения (JPG, PNG, WebP, GIF)" },
      { status: 400 }
    );
  }

  // Генерируем имя сами — исходное имя из запроса не используем (path traversal).
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${detected.ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  const url = `/uploads/${filename}`;

  return NextResponse.json({ url, filename });
}
