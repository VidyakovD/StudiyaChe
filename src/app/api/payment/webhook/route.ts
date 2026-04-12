import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPurchaseEmail } from "@/lib/email";

// Вебхук от ЮKassa — подтверждение успешной оплаты
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ЮKassa отправляет event "payment.succeeded"
    if (body.event !== "payment.succeeded") {
      return NextResponse.json({ ok: true });
    }

    const payment = body.object;
    const paymentId = payment?.id;
    const courseId = payment?.metadata?.courseId;
    const userId = payment?.metadata?.userId;

    if (!courseId || !userId || !paymentId) {
      return NextResponse.json({ ok: true });
    }

    // === ПРОВЕРКА: запрашиваем статус платежа напрямую у ЮКассы ===
    const shopId = process.env.YUKASSA_SHOP_ID;
    const secretKey = process.env.YUKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
      return NextResponse.json({ ok: true });
    }

    const verifyRes = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64"),
      },
    });

    if (!verifyRes.ok) {
      console.error("[Webhook] Не удалось проверить платёж:", paymentId);
      return NextResponse.json({ ok: true });
    }

    const verified = await verifyRes.json();

    // Проверяем что платёж реально succeeded
    if (verified.status !== "succeeded") {
      console.error("[Webhook] Платёж не подтверждён:", paymentId, verified.status);
      return NextResponse.json({ ok: true });
    }

    // Проверяем что metadata совпадает
    if (verified.metadata?.courseId !== courseId || verified.metadata?.userId !== userId) {
      console.error("[Webhook] Metadata не совпадает:", paymentId);
      return NextResponse.json({ ok: true });
    }

    // Проверяем что покупка ещё не создана
    const existing = await prisma.purchase.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!existing) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return NextResponse.json({ ok: true });
      }

      // Проверяем что сумма платежа совпадает с ценой курса
      const paidAmount = parseFloat(verified.amount?.value);
      if (Math.abs(paidAmount - course.price) > 1) {
        console.error("[Webhook] Сумма не совпадает:", paidAmount, "vs", course.price);
        return NextResponse.json({ ok: true });
      }

      await prisma.purchase.create({
        data: { userId, courseId, amount: paidAmount },
      });

      // Отправляем email об успешной оплате (fire-and-forget)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        sendPurchaseEmail(user.email, course.title, paidAmount, courseId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Webhook] Error:", e);
    return NextResponse.json({ ok: true }); // Всегда 200 чтобы ЮKassa не ретраила
  }
}
