import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createHash } from "crypto";

// Общий email: строго валидный, нижний регистр, без пробелов
export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .toLowerCase()
  .email("Некорректный email");

export const passwordSchema = z
  .string()
  .min(6, "Пароль должен быть минимум 6 символов")
  .max(128, "Пароль слишком длинный");

export const nameSchema = z.string().trim().min(1).max(100);

// Безопасный URL: http(s):// или относительный путь "/...".
// Блокирует javascript:, data:, file:, vbscript: и т.п.
export const safeUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    if (!v) return true;
    // Относительные пути на наш же домен — разрешены (аплоады, внутренние страницы)
    if (v.startsWith("/") && !v.startsWith("//")) return true;
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "URL должен быть http(s):// или начинаться с /");

export const optionalSafeUrl = safeUrlSchema.optional().nullable();

// Парсинг body + унифицированный ответ при ошибке валидации
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Некорректный JSON" },
        { status: 400 }
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message || "Некорректные данные";
    return {
      ok: false,
      response: NextResponse.json(
        { error: message, issues: parsed.error.issues },
        { status: 400 }
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

// Хеширование email/verify/reset токенов для хранения в БД.
// Токен по-прежнему генерируется как 128-битный random UUID,
// но в БД кладётся только sha256(token). Перехват БД не даёт возможности
// использовать токен для верификации/сброса пароля.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Экранирование пользовательского ввода для вставки в HTML (письма, и т.п.)
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Обёртка для экспорта z, чтобы не плодить импорты
export { z, ZodError };
