import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, z } from "@/lib/validation";

const paymentSchema = z.object({
  courseId: z.string().trim().min(1).max(64),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Необходимо авторизоваться", redirect: "/auth/login" },
      { status: 401 }
    );
  }

  const parsed = await parseBody(req, paymentSchema);
  if (!parsed.ok) return parsed.response;
  const { courseId } = parsed.data;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
  }

  const existing = await prisma.purchase.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Курс уже куплен" }, { status: 409 });
  }

  // Получить email пользователя для чека
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  // ЮKassa API — создание платежа
  const shopId = process.env.YUKASSA_SHOP_ID;
  const secretKey = process.env.YUKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    return NextResponse.json({ error: "Платёжная система не настроена" }, { status: 500 });
  }

  // Криптостойкий ключ — иначе при коллизии (двойной клик / параллель)
  // ЮKassa вернёт URL прошлого платежа, и деньги уйдут на чужую покупку.
  const idempotenceKey = randomUUID();

  const paymentData = {
    amount: {
      value: course.price.toFixed(2),
      currency: "RUB",
    },
    confirmation: {
      type: "redirect",
      // userId не нужен в URL — callback читает его из сессии.
      return_url: `${process.env.NEXTAUTH_URL}/api/payment/callback?courseId=${encodeURIComponent(courseId)}`,
    },
    capture: true,
    description: `Курс: ${course.title}`,
    metadata: {
      courseId,
      userId: session.user.id,
    },
    receipt: {
      customer: {
        email: user?.email || session.user.email,
      },
      items: [
        {
          description: course.title.substring(0, 128),
          quantity: "1",
          amount: {
            value: course.price.toFixed(2),
            currency: "RUB",
          },
          vat_code: 1, // без НДС
          payment_subject: "service",
          payment_mode: "full_payment",
        },
      ],
    },
  };

  try {
    const ykResponse = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64"),
        "Idempotence-Key": idempotenceKey,
      },
      body: JSON.stringify(paymentData),
    });

    const ykData = await ykResponse.json();

    if (!ykResponse.ok) {
      // 54-ФЗ / privacy: НЕ логируем payload — там состав чека, email и сумма.
      // Достаточно статуса и кода ошибки от ЮKassa.
      console.error(
        "[Payment] YuKassa error:",
        ykResponse.status,
        ykData?.code || ykData?.type || "unknown"
      );
      return NextResponse.json({ error: "Ошибка платёжной системы" }, { status: 502 });
    }

    // Вернуть URL для перенаправления на оплату
    const confirmationUrl = ykData.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      console.error("[Payment] No confirmation URL for paymentId:", ykData?.id || "<unknown>");
      return NextResponse.json({ error: "Ошибка создания платежа" }, { status: 500 });
    }

    return NextResponse.json({ redirect: confirmationUrl, paymentId: ykData.id });
  } catch (e) {
    const errType = (e as { name?: string })?.name || "unknown";
    console.error("[Payment] error:", errType);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
