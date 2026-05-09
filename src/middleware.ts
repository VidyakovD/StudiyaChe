import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting — простой in-memory лимитер
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > limit) {
    return true;
  }
  return false;
}

// Очистка старых записей каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // === Security headers ===
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // === Rate limiting на auth эндпоинты ===
  const path = req.nextUrl.pathname;

  // === Agent API (read-only для внешних агентов) ===
  // Bearer-токен в Authorization, 60 запросов/мин с IP.
  // Без / неверный токен → 401. Превышение — 429.
  if (path.startsWith("/api/agent/")) {
    const expected = process.env.AGENT_API_TOKEN;
    if (!expected) {
      return NextResponse.json(
        { error: "Agent API не настроен" },
        { status: 503 }
      );
    }
    const auth = req.headers.get("authorization") || "";
    const provided = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    // Constant-time comparison: длины могут отличаться, проверяем через
    // ручной XOR-аккумулятор, чтобы не открывать timing-атакой.
    let ok = provided.length === expected.length && provided.length > 0;
    if (provided.length === expected.length) {
      let diff = 0;
      for (let i = 0; i < expected.length; i++) {
        diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
      }
      ok = diff === 0;
    }
    if (!ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
      );
    }
    if (isRateLimited(`agent:${ip}`, 60, 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    return res;
  }

  // Регистрация: отдельный жёсткий лимит — 3 аккаунта с IP за час.
  // Защита от массового создания фейковых аккаунтов.
  if (path === "/api/auth/register") {
    if (isRateLimited(`register:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Превышен лимит регистраций с вашего IP. Попробуйте через час." },
        { status: 429 }
      );
    }
  }

  // Логин/forgot-password/reset/resend/unsubscribe: 10 попыток за 15 минут
  if (
    path === "/api/auth/callback/credentials" ||
    path === "/api/auth/register" ||
    path === "/api/auth/forgot-password" ||
    path === "/api/auth/reset-password" ||
    path === "/api/auth/resend-verification" ||
    path === "/api/auth/unsubscribe"
  ) {
    if (isRateLimited(`auth:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Слишком много попыток. Подождите 15 минут." },
        { status: 429 }
      );
    }
  }

  // AI-чат: 30 запросов за 1 минуту
  if (path === "/api/ai-chat") {
    if (isRateLimited(`chat:${ip}`, 30, 60 * 1000)) {
      return NextResponse.json(
        { error: "Слишком много запросов. Подождите." },
        { status: 429 }
      );
    }
  }

  // Платежи: 5 попыток за 5 минут
  if (path === "/api/payment") {
    if (isRateLimited(`pay:${ip}`, 5, 5 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Слишком много попыток оплаты. Подождите." },
        { status: 429 }
      );
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Только API-роуты — не трогаем фронтенд и статику
    "/api/:path*",
  ],
};
