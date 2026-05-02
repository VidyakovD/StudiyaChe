import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

// One-click unsubscribe из маркетинговой рассылки (38-ФЗ).
// GET — для клика прямо из письма; POST — для List-Unsubscribe-Post (RFC 8058).
async function handle(req: NextRequest): Promise<NextResponse> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://studiache.ru";
  const token = req.nextUrl.searchParams.get("token");

  const email = token ? verifyUnsubscribeToken(token) : null;
  if (!email) {
    return new NextResponse(page(baseUrl, false, "Ссылка повреждена или устарела."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    // updateMany — чтобы не было исключения, если юзер уже удалён.
    await prisma.user.updateMany({
      where: { email },
      data: { subscribedToNewsletter: false },
    });
    return new NextResponse(page(baseUrl, true, ""), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    console.error("[Unsubscribe] error:", (e as { code?: string })?.code || "unknown");
    return new NextResponse(page(baseUrl, false, "Не удалось обновить подписку. Попробуйте позже."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

function page(baseUrl: string, ok: boolean, errorMsg: string): string {
  const title = ok ? "Вы отписались от рассылки" : "Не удалось отписаться";
  const body = ok
    ? "Мы больше не будем отправлять вам маркетинговые письма. Сервисные уведомления (подтверждение оплаты, чеки, восстановление пароля) продолжат приходить."
    : errorMsg;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Студия ЧЕ</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0f; font-family:system-ui,sans-serif; color:#f0f0f5; padding:20px; }
    .card { text-align:center; padding:48px 32px; max-width:480px; background:rgba(22,22,31,0.8); border:1px solid rgba(255,255,255,0.08); border-radius:16px; }
    .icon { width:64px; height:64px; margin:0 auto 20px; background:rgba(${ok ? "52,211,153" : "239,68,68"},0.15); border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:32px; }
    h1 { font-size:24px; margin:0 0 12px; }
    p { color:#a0a0b0; margin:0 0 24px; font-size:15px; line-height:1.6; }
    a { display:inline-block; background:linear-gradient(135deg,#ff6b2b,#ff8c42); color:#fff; padding:12px 32px; border-radius:50px; text-decoration:none; font-weight:600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${ok ? "✓" : "!"}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <a href="${baseUrl}">Вернуться на сайт</a>
  </div>
</body>
</html>`;
}
