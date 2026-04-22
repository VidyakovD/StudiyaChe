"use client";

import { useRef } from "react";
import { Bold, Italic, Underline, Copy } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function LessonDescriptionEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after: string = before) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length;
      ta.setSelectionRange(pos, pos + selected.length);
    });
  };

  const insertCopyBlock = () => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const needsLeadNl = start > 0 && value[start - 1] !== "\n";
    const needsTrailNl = end < value.length && value[end] !== "\n";
    const before = `${needsLeadNl ? "\n" : ""}\`\`\`\n`;
    const after = `\n\`\`\`${needsTrailNl ? "\n" : ""}`;
    const inner = selected || "текст для копирования";
    const next = value.slice(0, start) + before + inner + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length;
      ta.setSelectionRange(pos, pos + inner.length);
    });
  };

  const btn =
    "p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors";

  return (
    <div>
      <div className="flex gap-1 mb-1.5">
        <button type="button" onClick={() => wrap("**")} title="Жирный" className={btn}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => wrap("*")} title="Курсив" className={btn}>
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => wrap("__")} title="Подчёркнутый" className={btn}>
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertCopyBlock}
          title="Блок копирования (клик копирует текст)"
          className={btn}
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-dark min-h-[80px] resize-y w-full"
      />
    </div>
  );
}
