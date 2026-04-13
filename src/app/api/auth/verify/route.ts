import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const baseUrl = process.env.NEXTAUTH_URL || "https://studiache.ru";

    if (!token) {
      return new NextResponse(errorPage(baseUrl, "Ссылка повреждена"), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      // Возможно уже верифицирован — проверим
      return new NextResponse(errorPage(baseUrl, "Ссылка уже использована или устарела. Попробуй войти — возможно email уже подтверждён."), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null },
    });

    // Успешная страница с автоматическим редиректом
    return new NextResponse(successPage(baseUrl), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new NextResponse("Ошибка сервера", { status: 500 });
  }
}

function successPage(baseUrl: string) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="3;url=${baseUrl}/auth/login?verified=true">
  <title>Email подтверждён — Студия ЧЕ</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0f; font-family:system-ui,sans-serif; color:#f0f0f5; }
    .card { text-align:center; padding:48px 32px; max-width:400px; background:rgba(22,22,31,0.8); border:1px solid rgba(255,255,255,0.08); border-radius:16px; }
    .icon { width:64px; height:64px; margin:0 auto 20px; background:rgba(52,211,153,0.15); border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:32px; }
    h1 { font-size:24px; margin:0 0 8px; }
    p { color:#a0a0b0; margin:0 0 24px; font-size:15px; }
    a { display:inline-block; background:linear-gradient(135deg,#ff6b2b,#ff8c42); color:#fff; padding:12px 32px; border-radius:50px; text-decoration:none; font-weight:600; }
    .hint { color:#6a6a7a; font-size:13px; margin-top:16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Email подтверждён!</h1>
    <p>Теперь можешь войти в аккаунт</p>
    <a href="${baseUrl}/auth/login?verified=true">Войти</a>
    <p class="hint">Автоматический переход через 3 секунды...</p>
  </div>
</body>
</html>`;
}

function errorPage(baseUrl: string, message: string) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Верификация — Студия ЧЕ</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0f; font-family:system-ui,sans-serif; color:#f0f0f5; }
    .card { text-align:center; padding:48px 32px; max-width:400px; background:rgba(22,22,31,0.8); border:1px solid rgba(255,255,255,0.08); border-radius:16px; }
    h1 { font-size:24px; margin:0 0 8px; }
    p { color:#a0a0b0; margin:0 0 24px; font-size:15px; }
    a { display:inline-block; background:linear-gradient(135deg,#ff6b2b,#ff8c42); color:#fff; padding:12px 32px; border-radius:50px; text-decoration:none; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Верификация</h1>
    <p>${message}</p>
    <a href="${baseUrl}/auth/login">Перейти к входу</a>
  </div>
</body>
</html>`;
}
