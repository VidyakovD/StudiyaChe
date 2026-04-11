import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const courses = await prisma.course.findMany({
    include: {
      category: true,
      _count: { select: { purchases: true, lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { lessons, ...courseData } = body;

  const course = await prisma.course.create({
    data: {
      ...courseData,
      lessons: {
        create: (lessons || []).map((l: Record<string, unknown>, i: number) => ({
          title: l.title as string,
          description: (l.description as string) || null,
          videoUrl: (l.videoUrl as string) || null,
          imageUrl: (l.imageUrl as string) || null,
          order: i + 1,
          links: (l.links as string) || null,
          homework: (l.homework as string) || null,
        })),
      },
    },
  });

  return NextResponse.json({ course });
}
