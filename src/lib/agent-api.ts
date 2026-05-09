import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Стандартный JSON-ответ для агентского API: явный charset + private-кэш на минуту.
export function agentJson<T>(data: T, init: { status?: number; headers?: Record<string, string> } = {}): NextResponse {
  return NextResponse.json(data, {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, max-age=60",
      ...(init.headers || {}),
    },
  });
}

// Rate-limit для /api/agent/* живёт ЗДЕСЬ, а не в middleware.
// Middleware в Next.js работает на Edge — in-memory Map не сохраняется
// между запросами, и счётчик никогда не растёт. В route handler уже
// Node-runtime, Map работает как ожидается.
const agentRateLimit = new Map<string, { count: number; resetAt: number }>();
const AGENT_LIMIT = 60;
const AGENT_WINDOW_MS = 60 * 1000;

export function checkAgentRateLimit(req: NextRequest): NextResponse | null {
  const ip = req.headers.get("x-real-ip")
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const now = Date.now();
  const entry = agentRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    agentRateLimit.set(ip, { count: 1, resetAt: now + AGENT_WINDOW_MS });
    return null;
  }
  entry.count++;
  if (entry.count > AGENT_LIMIT) {
    return agentJson(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  return null;
}

// Базовый URL для построения публичных ссылок на курс/урок.
// Зевс будет показывать пользователю реальные URL — пусть совпадают с фронтом.
export function baseUrl(): string {
  return process.env.NEXTAUTH_URL || "https://studiache.ru";
}

// Унифицированный нормализатор тегов из БД-полей. Сейчас в схеме нет поля tags
// напрямую — тащим из категории. При появлении поля Course.tags подключим его.
export function tagsForCourse(category?: { name?: string | null } | null): string[] {
  const t: string[] = [];
  if (category?.name) t.push(category.name);
  return t;
}
