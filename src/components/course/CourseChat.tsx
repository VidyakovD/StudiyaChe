"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
    avatarUrl: string | null;
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return `${hours}:${minutes}`;
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}.${month} ${hours}:${minutes}`;
}

export default function CourseChat({ courseId }: { courseId: string }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        const msgs: ChatMessage[] = data.messages || [];
        setMessages(msgs);
        if (!isOpen && msgs.length > lastCountRef.current) {
          setUnread(msgs.length - lastCountRef.current);
        }
        if (isOpen) {
          lastCountRef.current = msgs.length;
        }
      }
    } catch {
      // ignore
    }
  }, [courseId, isOpen]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      lastCountRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`/api/chat/${courseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      setText("");
      await fetchMessages();
    } catch {
      // ignore
    }
    setSending(false);
  };

  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  return (
    <div className="fixed bottom-0 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-2 w-[400px] max-h-[500px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "#16161f",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#ff6b2b]" />
                <span className="text-sm font-semibold text-[#f0f0f5]">
                  Чат курса
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#6a6a7a] hover:text-[#f0f0f5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[380px]">
              {messages.length === 0 && (
                <p className="text-center text-[#6a6a7a] text-sm py-8">
                  Сообщений пока нет. Начните беседу!
                </p>
              )}
              {messages.map((msg) => {
                const isMe = msg.user.id === currentUserId;
                const displayName =
                  msg.user.nickname || msg.user.name || "Аноним";
                const initials = getInitials(displayName);

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      {msg.user.avatarUrl ? (
                        <img
                          src={msg.user.avatarUrl}
                          alt={displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            background: isMe
                              ? "#ff6b2b"
                              : "#a855f7",
                          }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[70%] rounded-xl px-3 py-2 ${
                        isMe
                          ? "bg-[#ff6b2b]/15 border border-[#ff6b2b]/20"
                          : "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]"
                      }`}
                    >
                      <div
                        className={`flex items-baseline gap-2 mb-0.5 ${
                          isMe ? "flex-row-reverse" : ""
                        }`}
                      >
                        <span className="text-xs font-medium text-[#a0a0b0]">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-[#6a6a7a]">
                          {formatMessageDate(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[#f0f0f5] break-words whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] flex gap-2"
            >
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Написать сообщение..."
                className="input-dark flex-1 text-sm !py-2"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="w-9 h-9 rounded-xl bg-[#ff6b2b] hover:bg-[#ff6b2b]/80 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="mb-4 flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300"
        style={{
          background: isOpen
            ? "rgba(255,107,43,0.15)"
            : "#ff6b2b",
          color: isOpen ? "#ff6b2b" : "#fff",
          border: isOpen ? "1px solid rgba(255,107,43,0.3)" : "none",
          boxShadow: isOpen ? "none" : "0 4px 20px rgba(255,107,43,0.3)",
        }}
      >
        <MessageCircle className="w-4 h-4" />
        Чат курса
        {unread > 0 && !isOpen && (
          <span className="ml-1 w-5 h-5 rounded-full bg-[#a855f7] text-white text-xs flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
