import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Токен не указан" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Неверный или устаревший токен" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifyToken: null },
    });

    return NextResponse.redirect(
      new URL("/auth/login?verified=true", req.nextUrl.origin)
    );
  } catch {
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
