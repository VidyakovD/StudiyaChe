import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/validation";
import { verifyRegistrationToken } from "@/lib/registration-token";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const baseUrl = process.env.NEXTAUTH_URL || "https://studiache.ru";

    if (!token || typeof token !== "string" || token.length > 4096) {
      return htmlPage(errorPage(baseUrl, "Ссылка повреждена"), 400);
    }

    // === Новый путь: registration-token (HMAC + payload) ===
    // Если токен валиден — создаём User прямо здесь. До этого момента
    // в БД ничего о юзере не лежало.
    const payload = verifyRegistrationToken(token);
    if (payload) {
      try {
        await prisma.user.create({
          data: {
            email: payload.email,
            name: payload.name,
            password: payload.passwordHash,
            emailVerified: true,
            consentToProcessingAt: new Date(payload.consentAt),
            subscribedToNewsletter: payload.agreeNewsletter,
          },
        });
        return htmlPage(successPage(baseUrl), 200);
      } catch (e: unknown) {
        if ((e as { code?: string })?.code === "P2002") {
          // Кто-то уже зарегистрировался с этим email — например,
          // юзер открыл вторую ссылку из дублирующего письма.
          return htmlPage(
            errorPage(
              baseUrl,
              "Email уже подтверждён или зарегистрирован. Войдите в аккаунт."
            ),
            200
          );
        }
        console.error("[Verify] create error:", (e as { code?: string })?.code || "unknown");
        return htmlPage(errorPage(baseUrl, "Не удалось завершить регистрацию. Попробуйте позже."), 500);
      }
    }

    // === Legacy fallback: старые токены, которые лежат в User.verifyToken ===
    // Этот путь нужен на время для уже зарегистрированных, но не подтвердивших
    // юзеров (которые в БД с emailVerified=false и verifyToken=hash(token)).
    // После того как все старые pending-юзеры либо подтвердят либо будут удалены,
    // эту ветку можно убрать.
    const user = await prisma.user.findFirst({
      where: { verifyToken: hashToken(token) },
    });

    if (!user) {
      return htmlPage(
        errorPage(
          baseUrl,
          "Ссылка устарела или уже использована. Попробуйте войти — возможно email уже подтверждён."
        ),
        200
      );
    }

    if (user.verifyTokenExp && user.verifyTokenExp < new Date()) {
      return htmlPage(
        errorPage(
          baseUrl,
          "Ссылка устарела. Зарегистрируйтесь заново."
        ),
        200
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null, verifyTokenExp: null },
    });

    return htmlPage(successPage(baseUrl), 200);
  } catch (error) {
    console.error("[Verify] error:", (error as { code?: string })?.code || "unknown");
    return new NextResponse("Ошибка сервера", { status: 500 });
  }
}

function htmlPage(html: string, status: number): NextResponse {
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
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
    <p>Аккаунт создан. Теперь можешь войти.</p>
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
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0f; font-family:system-ui,sans-serif; color:#f0f0f5; padding:20px; }
    .card { text-align:center; padding:48px 32px; max-width:480px; background:rgba(22,22,31,0.8); border:1px solid rgba(255,255,255,0.08); border-radius:16px; }
    h1 { font-size:24px; margin:0 0 8px; }
    p { color:#a0a0b0; margin:0 0 24px; font-size:15px; line-height:1.6; }
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
