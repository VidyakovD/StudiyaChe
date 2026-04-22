"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, Copy } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMdToHtml(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([\s\S]+?)__/g, "<u>$1</u>");
  html = html.replace(/\*([\s\S]+?)\*/g, "<em>$1</em>");
  html = html.replace(/\n/g, "<br>");
  return html;
}

function mdToHtml(md: string): string {
  if (!md) return "";
  const parts = md.split(/```([\s\S]*?)```/);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        const inner = part.replace(/^\n+|\n+$/g, "");
        return `<pre data-copy="1">${escapeHtml(inner)}</pre>`;
      }
      return inlineMdToHtml(part);
    })
    .join("");
}

function htmlToMd(root: HTMLElement): string {
  let out = "";

  const walk = (node: Node): string => {
    let s = "";
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        s += child.textContent ?? "";
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === "br") {
          s += "\n";
        } else if (tag === "pre" && el.getAttribute("data-copy") === "1") {
          const inner = el.textContent ?? "";
          if (s && !s.endsWith("\n")) s += "\n";
          s += "```\n" + inner + "\n```\n";
        } else if (tag === "strong" || tag === "b") {
          s += `**${walk(el)}**`;
        } else if (tag === "em" || tag === "i") {
          s += `*${walk(el)}*`;
        } else if (tag === "u") {
          s += `__${walk(el)}__`;
        } else if (tag === "div" || tag === "p") {
          if (s && !s.endsWith("\n")) s += "\n";
          s += walk(el);
          if (!s.endsWith("\n")) s += "\n";
        } else {
          s += walk(el);
        }
      }
    });
    return s;
  };

  out = walk(root);
  return out.replace(/\n{3,}/g, "\n\n").replace(/\n+$/, "");
}

export default function LessonDescriptionEditor({ value, onChange, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef<string>("");

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const v = value ?? "";
    if (v !== lastEmittedRef.current) {
      el.innerHTML = mdToHtml(v);
      lastEmittedRef.current = v;
    }
  }, [value]);

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    const md = htmlToMd(el);
    lastEmittedRef.current = md;
    onChange(md);
  };

  const applyFormat = (cmd: "bold" | "italic" | "underline") => {
    editorRef.current?.focus();
    document.execCommand(cmd);
    emit();
  };

  const insertCopyBlock = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    const selectedText = sel.toString();
    const pre = document.createElement("pre");
    pre.setAttribute("data-copy", "1");
    pre.textContent = selectedText || "текст для копирования";

    range.deleteContents();
    range.insertNode(pre);

    const after = document.createElement("br");
    pre.after(after);

    const newRange = document.createRange();
    newRange.setStartAfter(after);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    emit();
  };

  const btn =
    "p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors";

  return (
    <div>
      <div className="flex gap-1 mb-1.5">
        <button type="button" onClick={() => applyFormat("bold")} title="Жирный (Ctrl+B)" className={btn}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => applyFormat("italic")} title="Курсив (Ctrl+I)" className={btn}>
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => applyFormat("underline")} title="Подчёркнутый (Ctrl+U)" className={btn}>
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertCopyBlock}
          title="Блок копирования (клик на блок на сайте копирует его текст)"
          className={btn}
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="input-dark wysiwyg-editor min-h-[80px] w-full"
      />
    </div>
  );
}
