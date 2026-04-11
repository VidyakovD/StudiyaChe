import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Необходимо авторизоваться", redirect: "/auth/login" },
      { status: 401 }
    );
  }

  const { courseId } = await req.json();

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

  const idempotenceKey = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const paymentData = {
    amount: {
      value: course.price.toFixed(2),
      currency: "RUB",
    },
    confirmation: {
      type: "redirect",
      return_url: `${process.env.NEXTAUTH_URL}/api/payment/callback?courseId=${courseId}&userId=${session.user.id}`,
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
      console.error("YuKassa error:", ykData);
      return NextResponse.json({ error: "Ошибка платёжной системы" }, { status: 502 });
    }

    // Вернуть URL для перенаправления на оплату
    const confirmationUrl = ykData.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      console.error("No confirmation URL:", ykData);
      return NextResponse.json({ error: "Ошибка создания платежа" }, { status: 500 });
    }

    return NextResponse.json({ redirect: confirmationUrl, paymentId: ykData.id });
  } catch (e) {
    console.error("Payment error:", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
