"use client";

import { useState, type ReactNode } from "react";
import { Play, Copy, Check } from "lucide-react";

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group relative block w-full text-left my-3 rounded-xl bg-bg-secondary border border-border-default hover:border-accent/40 transition-colors px-4 py-3 pr-12 cursor-pointer"
    >
      <pre className="whitespace-pre-wrap font-mono text-sm text-text-primary m-0">
        {text}
      </pre>
      <span
        className={`absolute top-2 right-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
          copied
            ? "bg-green-500/15 text-green-400 border border-green-500/30"
            : "bg-accent/10 text-accent border border-accent/20 group-hover:bg-accent/20"
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            Скопировано
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Копировать
          </>
        )}
      </span>
    </button>
  );
}

function Timecode({ value }: { value: string }) {
  const m = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return <>{value}</>;
  const h = m[3] ? parseInt(m[1]) : 0;
  const min = m[3] ? parseInt(m[2]) : parseInt(m[1]);
  const s = m[3] ? parseInt(m[3]) : parseInt(m[2]);
  const total = h * 3600 + min * 60 + s;
  return (
    <button
      type="button"
      onClick={() => {
        const fn = (window as unknown as Record<string, unknown>).__videoSeekTo as
          | ((t: number) => void)
          | undefined;
        if (fn) fn(total);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-mono cursor-pointer border border-accent/20 mx-1"
    >
      <Play className="w-3 h-3" fill="currentColor" />
      {value}
    </button>
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[\s\S]+?\*\*)|(__[\s\S]+?__)|(\*[\s\S]+?\*)|(\d{1,2}:\d{2}(?::\d{2})?)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(text.slice(lastIndex, m.index));
    }
    if (m[1]) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`}>{m[1].slice(2, -2)}</strong>);
    } else if (m[2]) {
      nodes.push(<u key={`${keyPrefix}-u${i}`}>{m[2].slice(2, -2)}</u>);
    } else if (m[3]) {
      nodes.push(<em key={`${keyPrefix}-i${i}`}>{m[3].slice(1, -1)}</em>);
    } else if (m[4]) {
      nodes.push(<Timecode key={`${keyPrefix}-t${i}`} value={m[4]} />);
    }
    i++;
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export default function LessonDescription({ text }: { text: string }) {
  const parts = text.split(/```([\s\S]*?)```/);
  return (
    <div className="text-text-secondary text-lg leading-relaxed mb-8 whitespace-pre-wrap">
      {parts.map((part, idx) => {
        if (idx % 2 === 1) {
          return <CopyBlock key={`cb${idx}`} text={part.replace(/^\n+|\n+$/g, "")} />;
        }
        return <span key={`tx${idx}`}>{renderInline(part, `p${idx}`)}</span>;
      })}
    </div>
  );
}
