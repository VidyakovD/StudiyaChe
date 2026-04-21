import path from "path";

// Где физически хранятся файлы уроков. Вне public/, чтобы прямая ссылка
// не давала скачать без авторизации — всё идёт через /api/lesson-file/[id].
export const LESSON_FILES_DIR = path.join(process.cwd(), "storage", "lesson-files");

export const LESSON_FILE_MAX_SIZE = 30 * 1024 * 1024; // 30 MB

// Белый список разрешённых MIME-типов. Важно: не принимаем .exe/.html/.js —
// даже с Content-Disposition: attachment лишнее добро хранить не стоит.
export const LESSON_FILE_ALLOWED_MIME = new Set<string>([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/csv",
  "application/rtf",
]);

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

// Расширение по имени, безопасное для хранения (убираем "..", слеши).
export function safeExtension(originalName: string): string {
  const ext = (originalName.split(".").pop() || "").toLowerCase();
  if (!/^[a-z0-9]{1,8}$/.test(ext)) return "bin";
  return ext;
}
