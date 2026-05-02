import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPurchaseEmail } from "@/lib/email";
import { isYukassaIp, isYukassaIpCheckEnabled } from "@/lib/yookassa-ips";

// Цены и оплата идут в копейках — сравниваем через копейки, чтобы не ловить
// артефакты float-арифметики и не допускать тихой "погрешности" в рублях.
function toKopecks(value: number): number {
  return Math.round(value * 100);
}

// Вебхук от ЮKassa — подтверждение успешной оплаты
export async function POST(req: NextRequest) {
  // IP-allowlist (опционально, включается через YUKASSA_VERIFY_IP=true).
  // Реальная проверка платежа всё равно идёт через double-fetch к API ЮKassa,
  // но allowlist отсекает лишний шум до выхода в сеть.
  if (isYukassaIpCheckEnabled()) {
    const fwd = req.headers.get("x-real-ip")
      || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "";
    if (!isYukassaIp(fwd)) {
      console.error("[Webhook] reject by IP allowlist");
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  let body: { event?: string; object?: { id?: string; metadata?: { courseId?: string; userId?: string } } };
  try {
    body = await req.json();
  } catch {
    // Некорректный JSON — это не наш платёж, ретраить нет смысла.
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // ЮKassa отправляет event "payment.succeeded"
  if (body.event !== "payment.succeeded") {
    return NextResponse.json({ ok: true });
  }

  const payment = body.object;
  const paymentId = payment?.id;
  const courseId = payment?.metadata?.courseId;
  const userId = payment?.metadata?.userId;

  if (!courseId || !userId || !paymentId) {
    // Невалидные metadata — наш баг или подделка. Ретраить бесполезно, отвечаем 200.
    console.error("[Webhook] empty metadata:", paymentId || "<no-id>");
    return NextResponse.json({ ok: true });
  }

  const shopId = process.env.YUKASSA_SHOP_ID;
  const secretKey = process.env.YUKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    // Конфиг сервера — даём ЮKassa повторить, когда переменные появятся.
    console.error("[Webhook] YUKASSA_* не настроены");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  // === ПРОВЕРКА: запрашиваем статус платежа напрямую у ЮКассы ===
  let verified: { status?: string; metadata?: { courseId?: string; userId?: string }; amount?: { value?: string } };
  try {
    const verifyRes = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64"),
      },
    });

    if (!verifyRes.ok) {
      // Сетевой/временный сбой ЮKassa API — пусть ретраит.
      console.error("[Webhook] verify failed:", paymentId, verifyRes.status);
      return NextResponse.json({ error: "verify failed" }, { status: 502 });
    }

    verified = await verifyRes.json();
  } catch {
    console.error("[Webhook] verify network error:", paymentId);
    return NextResponse.json({ error: "verify network error" }, { status: 502 });
  }

  if (verified.status !== "succeeded") {
    // 54-ФЗ / privacy: в логи не пишем суммы, payload и состав платежа — только id.
    console.error("[Webhook] not succeeded:", paymentId);
    return NextResponse.json({ ok: true });
  }

  // Metadata должна точно совпадать с тем, что в платеже у ЮKassa
  if (verified.metadata?.courseId !== courseId || verified.metadata?.userId !== userId) {
    console.error("[Webhook] metadata mismatch:", paymentId);
    return NextResponse.json({ ok: true });
  }

  try {
    const existing = await prisma.purchase.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      // Идемпотентность: повторный webhook на ту же покупку.
      return NextResponse.json({ ok: true });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      console.error("[Webhook] course not found:", paymentId);
      return NextResponse.json({ ok: true });
    }

    const paidAmount = parseFloat(verified.amount?.value ?? "");
    if (!Number.isFinite(paidAmount) || toKopecks(paidAmount) !== toKopecks(course.price)) {
      // Намеренно НЕ пишем сами суммы — только paymentId.
      console.error("[Webhook] amount mismatch:", paymentId);
      return NextResponse.json({ ok: true });
    }

    try {
      await prisma.purchase.create({
        data: { userId, courseId, amount: paidAmount },
      });
    } catch (e: unknown) {
      // P2002 = unique violation, гонка с другим webhook — ок, считаем покупку созданной.
      if ((e as { code?: string })?.code === "P2002") {
        return NextResponse.json({ ok: true });
      }
      throw e;
    }

    // Email об успешной оплате (fire-and-forget — почта не должна валить webhook;
    // sendPurchaseEmail сам обёрнут в catch внутри email.ts)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      sendPurchaseEmail(user.email, course.title, paidAmount, courseId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Сбой БД — пусть ретраит. Тип ошибки логируем, payload — нет.
    const errType = (e as { code?: string; name?: string })?.code
      || (e as { name?: string })?.name
      || "unknown";
    console.error("[Webhook] db error:", paymentId, errType);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }
}
