"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Search } from "lucide-react";
import Header from "@/components/layout/Header";

interface ChatPreview {
  courseId: string;
  courseTitle: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  messageCount: number;
}

interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
    avatarUrl: string | null;
    role: string;
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

function formatDate(dateStr: string): string {
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

export default function AdminChatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (
      status === "authenticated" &&
      (session?.user as { role?: string } | undefined)?.role !== "ADMIN"
    ) {
      router.push("/");
    }
  }, [status, session, router]);

  // Fetch chat list
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/chats");
        if (res.ok) {
          const data = await res.json();
          setChats(data.chats || []);
        }
      } catch {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch selected chat messages
  const fetchMessages = useCallback(async () => {
    if (!selectedCourseId) return;
    try {
      const res = await fetch(`/api/admin/chats/${selectedCourseId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // ignore
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchMessages();
    if (!selectedCourseId) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages, selectedCourseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending || !selectedCourseId) return;
    setSending(true);
    try {
      await fetch(`/api/admin/chats/${selectedCourseId}`, {
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

  const filteredChats = chats.filter((c) =>
    c.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="flex-1 flex min-h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside
          className="w-80 shrink-0 border-r border-[rgba(255,255,255,0.06)] flex flex-col overflow-hidden"
          style={{ background: "#0a0a0f" }}
        >
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-lg font-bold text-[#f0f0f5] mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#ff6b2b]" />
              Чаты курсов
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6a6a7a]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="input-dark !pl-9 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 && (
              <p className="text-center text-[#6a6a7a] text-sm py-8">
                Нет чатов
              </p>
            )}
            {filteredChats.map((chat) => (
              <button
                key={chat.courseId}
                onClick={() => setSelectedCourseId(chat.courseId)}
                className={`w-full text-left p-4 border-b border-[rgba(255,255,255,0.04)] transition-all duration-200 ${
                  selectedCourseId === chat.courseId
                    ? "bg-[#ff6b2b]/10 border-l-2 border-l-[#ff6b2b]"
                    : "hover:bg-[rgba(255,255,255,0.03)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-[#f0f0f5] truncate flex-1">
                    {chat.courseTitle}
                  </h3>
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#a855f7]/20 text-[#a855f7] text-xs flex items-center justify-center font-bold">
                    {chat.messageCount > 99 ? "99+" : chat.messageCount}
                  </span>
                </div>
                {chat.lastMessage && (
                  <p className="text-xs text-[#6a6a7a] truncate">
                    {chat.lastMessage}
                  </p>
                )}
                {chat.lastMessageAt && (
                  <span className="text-[10px] text-[#6a6a7a] mt-1 block">
                    {formatDate(chat.lastMessageAt)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex-1 flex flex-col" style={{ background: "#0a0a0f" }}>
          <AnimatePresence mode="wait">
            {!selectedCourseId ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-[#6a6a7a]/30 mx-auto mb-4" />
                  <p className="text-[#6a6a7a]">
                    Выберите чат из списка слева
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedCourseId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h2 className="text-lg font-bold text-[#f0f0f5]">
                    {chats.find((c) => c.courseId === selectedCourseId)
                      ?.courseTitle || "Чат"}
                  </h2>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {messages.length === 0 && (
                    <p className="text-center text-[#6a6a7a] text-sm py-8">
                      Сообщений пока нет
                    </p>
                  )}
                  {messages.map((msg) => {
                    const displayName =
                      msg.user.nickname || msg.user.name || "Аноним";
                    const initials = getInitials(displayName);
                    const isAdmin = msg.user.role === "ADMIN";

                    return (
                      <div key={msg.id} className="flex gap-3">
                        {/* Avatar */}
                        <div className="shrink-0">
                          {msg.user.avatarUrl ? (
                            <img
                              src={msg.user.avatarUrl}
                              alt={displayName}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{
                                background: isAdmin ? "#ff6b2b" : "#a855f7",
                              }}
                            >
                              {initials}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span
                              className={`text-sm font-medium ${
                                isAdmin ? "text-[#ff6b2b]" : "text-[#a0a0b0]"
                              }`}
                            >
                              {displayName}
                              {isAdmin && (
                                <span className="ml-1.5 text-[10px] bg-[#ff6b2b]/15 text-[#ff6b2b] px-1.5 py-0.5 rounded-full">
                                  admin
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-[#6a6a7a]">
                              {formatDate(msg.createdAt)}
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
                  className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] flex gap-3"
                >
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ответить как администратор..."
                    className="input-dark flex-1"
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="px-5 py-2 rounded-xl bg-[#ff6b2b] hover:bg-[#ff6b2b]/80 disabled:opacity-40 text-white font-medium text-sm flex items-center gap-2 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Отправить
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
