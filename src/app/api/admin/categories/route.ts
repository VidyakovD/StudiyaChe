import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, z } from "@/lib/validation";

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9а-яё-]+$/i, "Slug может содержать только буквы, цифры и дефисы"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    include: { _count: { select: { courses: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody(req, categoryCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { name, slug } = parsed.data;

  try {
    const category = await prisma.category.create({
      data: { name, slug },
      include: { _count: { select: { courses: true } } },
    });
    return NextResponse.json({ category });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "Категория с таким slug уже существует" },
        { status: 409 }
      );
    }
    console.error("[Admin] Create category error:", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
