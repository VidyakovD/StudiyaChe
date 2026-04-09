import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const { name, slug } = await req.json();

  const category = await prisma.category.create({
    data: { name, slug },
    include: { _count: { select: { courses: true } } },
  });

  return NextResponse.json({ category });
}
