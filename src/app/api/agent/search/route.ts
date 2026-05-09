import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentJson, baseUrl, checkAgentRateLimit } from "@/lib/agent-api";

// GET /api/agent/search?q=...&limit=10
// Ищет в title/description курсов и в title/description/links/homework уроков.
//
// PostgreSQL: используем `contains` с `mode: 'insensitive'` — это ILIKE.
// Это не fuzzy, но без полнотекстового индекса даёт нужное «найти подстроку».
export async function GET(req: NextRequest) {
  const limited = checkAgentRateLimit(req);
  if (limited) return limited;

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const limitRaw = Number(sp.get("limit") ?? "10");
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 10, 1), 50);

  if (!q) {
    return agentJson({ error: "q is required" }, { status: 400 });
  }
  if (q.length > 200) {
    return agentJson({ error: "q is too long" }, { status: 400 });
  }

  const base = baseUrl();

  const [courses, lessons] = await Promise.all([
    prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, description: true },
      take: limit,
    }),
    prisma.lesson.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { links: { contains: q, mode: "insensitive" } },
          { homework: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        courseId: true,
        title: true,
        description: true,
        homework: true,
      },
      take: limit,
    }),
  ]);

  // Сниппет: первые 200 символов первого поля, в котором найдено совпадение.
  // Если совпадения нет (теоретически невозможно — мы же по этим полям искали)
  // — берём что есть.
  const needle = q.toLowerCase();
  const snippet = (...sources: Array<string | null | undefined>): string | null => {
    for (const s of sources) {
      if (!s) continue;
      const idx = s.toLowerCase().indexOf(needle);
      if (idx >= 0) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(s.length, idx + needle.length + 140);
        return (start > 0 ? "…" : "") + s.slice(start, end) + (end < s.length ? "…" : "");
      }
    }
    // fallback: первое непустое
    const first = sources.find((s) => s && s.length > 0) || null;
    return first ? first.slice(0, 200) : null;
  };

  type Hit = { type: "course" | "lesson"; id: string; title: string; snippet: string | null; url: string };
  const results: Hit[] = [
    ...courses.map<Hit>((c) => ({
      type: "course",
      id: c.id,
      title: c.title,
      snippet: snippet(c.description, c.title),
      url: `${base}/course/${c.id}`,
    })),
    ...lessons.map<Hit>((l) => ({
      type: "lesson",
      id: l.id,
      title: l.title,
      snippet: snippet(l.description, l.homework, l.title),
      url: `${base}/course/${l.courseId}/learn`,
    })),
  ];

  // Если совокупно больше limit — обрезаем.
  return agentJson({ query: q, count: results.length, results: results.slice(0, limit) });
}
