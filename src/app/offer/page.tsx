import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { promises as fs } from "fs";
import path from "path";

export default async function OfferPage() {
  const filePath = path.join(process.cwd(), "public", "offer.txt");
  const text = await fs.readFile(filePath, "utf-8");

  const paragraphs = text.split("\n").filter((line) => line.trim());

  return (
    <>
      <Header />
      <main className="flex-1 relative z-10 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="gradient-border p-8 md:p-12">
            <div className="card-glow" />
            <div className="relative z-10 prose prose-invert max-w-none">
              {paragraphs.map((line, i) => {
                const trimmed = line.trim();
                if (i === 0) {
                  return (
                    <h1
                      key={i}
                      className="text-3xl font-bold mb-6 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] bg-clip-text text-transparent"
                    >
                      {trimmed}
                    </h1>
                  );
                }
                if (/^\d+\.\s+[А-ЯЁA-Z]/.test(trimmed) && !trimmed.includes("1.") || /^\d+\.\s+[А-ЯЁ]{2,}/.test(trimmed)) {
                  return (
                    <h2
                      key={i}
                      className="text-xl font-bold mt-10 mb-4 text-[var(--accent)]"
                    >
                      {trimmed}
                    </h2>
                  );
                }
                return (
                  <p
                    key={i}
                    className="text-[var(--text-secondary)] leading-relaxed mb-3 text-sm"
                  >
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
