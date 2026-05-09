import { NextResponse } from "next/server";

// Стандартный JSON-ответ для агентского API: явный charset + private-кэш на минуту.
export function agentJson<T>(data: T, init: { status?: number } = {}): NextResponse {
  return NextResponse.json(data, {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, max-age=60",
    },
  });
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
