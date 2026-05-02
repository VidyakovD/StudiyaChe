import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPurchaseEmail } from "@/lib/email";

// Цены и оплата идут в копейках — сравниваем через копейки, чтобы не ловить
// артефакты float-арифметики и не допускать тихой "погрешности" в рублях.
function toKopecks(value: number): number {
  return Math.round(value * 100);
}

// Вебхук от ЮKassa — подтверждение успешной оплаты
export async function POST(req: NextRequest) {
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
    console.error("[Webhook] Пустые metadata", { paymentId, courseId, userId });
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
  } catch (e) {
    console.error("[Webhook] verify network error:", paymentId, e);
    return NextResponse.json({ error: "verify network error" }, { status: 502 });
  }

  if (verified.status !== "succeeded") {
    console.error("[Webhook] Платёж не succeeded:", paymentId, verified.status);
    return NextResponse.json({ ok: true });
  }

  // Metadata должна точно совпадать с тем, что в платеже у ЮKassa
  if (verified.metadata?.courseId !== courseId || verified.metadata?.userId !== userId) {
    console.error("[Webhook] Metadata не совпадает:", paymentId);
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
      console.error("[Webhook] Курс не найден:", courseId);
      return NextResponse.json({ ok: true });
    }

    const paidAmount = parseFloat(verified.amount?.value ?? "");
    if (!Number.isFinite(paidAmount) || toKopecks(paidAmount) !== toKopecks(course.price)) {
      console.error("[Webhook] Сумма не совпадает:", paidAmount, "vs", course.price);
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
    // Сбой БД — пусть ретраит.
    console.error("[Webhook] DB error:", e);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }
}
