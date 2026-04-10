import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Вебхук от ЮKassa — подтверждение успешной оплаты
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ЮKassa отправляет event "payment.succeeded"
    if (body.event !== "payment.succeeded") {
      return NextResponse.json({ ok: true });
    }

    const payment = body.object;
    const courseId = payment?.metadata?.courseId;
    const userId = payment?.metadata?.userId;

    if (!courseId || !userId) {
      console.error("Webhook: missing metadata", payment?.metadata);
      return NextResponse.json({ ok: true });
    }

    // Проверяем что покупка ещё не создана
    const existing = await prisma.purchase.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!existing) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (course) {
        await prisma.purchase.create({
          data: {
            userId,
            courseId,
            amount: parseFloat(payment.amount?.value) || course.price,
          },
        });
        console.log(`Purchase confirmed: user=${userId} course=${courseId}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: true }); // Всегда 200 чтобы ЮKassa не ретраила
  }
}
