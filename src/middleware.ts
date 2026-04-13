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

  // Логин/регистрация: 10 попыток за 15 минут
  if (
    path === "/api/auth/callback/credentials" ||
    path === "/api/auth/register" ||
    path === "/api/auth/forgot-password"
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
