"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Send, ImagePlus, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  imageUrl?: string | null;
  createdAt: string;
  user: { id: string; name: string | null; nickname: string | null; avatarUrl: string | null };
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  if (d.toDateString() === now.toDateString()) return `${hh}:${mm}`;
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")} ${hh}:${mm}`;
}

export default function ChatPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/chat/${courseId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.messages || []);
    }
  }, [courseId]);

  useEffect(() => {
    fetchMessages();
    const i = setInterval(fetchMessages, 5000);
    return () => clearInterval(i);
  }, [fetchMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch(`/api/chat/${courseId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    setText("");
    await fetchMessages();
    setSending(false);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await r.json();
    if (d.url) {
      await fetch(`/api/chat/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "", imageUrl: d.url }),
      });
      await fetchMessages();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uid = (session?.user as { id?: string } | undefined)?.id;

  return (
    <div className="h-screen flex flex-col" style={{ background: "#0a0a0f", color: "#f0f0f5" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)]" style={{ background: "#111118" }}>
        <MessageCircle className="w-5 h-5 text-[#ff6b2b]" />
        <span className="font-semibold">Чат курса</span>
        <span className="text-xs text-[#6a6a7a] ml-auto">{messages.length} сообщений</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.user.id === uid;
          const name = msg.user.nickname || msg.user.name || "Аноним";
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="shrink-0">
                {msg.user.avatarUrl ? (
                  <img src={msg.user.avatarUrl} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: isMe ? "#ff6b2b" : "#a855f7" }}>
                    {getInitials(name)}
                  </div>
                )}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-[#ff6b2b]/15 border border-[#ff6b2b]/20" : "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]"}`}>
                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                  <span className="text-xs font-medium text-[#a0a0b0]">{name}</span>
                  <span className="text-[10px] text-[#6a6a7a]">{formatTime(msg.createdAt)}</span>
                </div>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} className="max-w-full rounded-lg mb-1 cursor-pointer hover:opacity-90" style={{ maxHeight: "300px" }} onClick={() => window.open(msg.imageUrl!, "_blank")} />
                )}
                {msg.text && <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] flex gap-2 items-center" style={{ background: "#111118" }}>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] flex items-center justify-center transition-colors shrink-0 disabled:opacity-40">
          {uploading ? <div className="w-4 h-4 border-2 border-[#6a6a7a] border-t-[#ff6b2b] rounded-full animate-spin" /> : <ImagePlus className="w-4 h-4 text-[#6a6a7a]" />}
        </button>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать сообщение..." className="flex-1 bg-[#16161f] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#ff6b2b] transition-colors" style={{ color: "#f0f0f5" }} />
        <button type="submit" disabled={sending || !text.trim()} className="w-10 h-10 rounded-xl bg-[#ff6b2b] hover:bg-[#ff6b2b]/80 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0">
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}
