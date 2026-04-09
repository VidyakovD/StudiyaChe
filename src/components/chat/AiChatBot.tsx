"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
}

const QUICK_REPLIES = [
  "Какой курс выбрать новичку?",
  "Расскажи про ИИ генерацию видео",
  "Чем Premiere Pro лучше DaVinci?",
  "Как ИИ помогает в бизнесе?",
];

export default function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "bot",
      text: "Привет! 👋 Я ЧЕ Ассистент — помогу выбрать курс, отвечу на вопросы о видеомонтаже, ИИ-генерации и нейросетях. Спрашивай!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now(), role: "user", text: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      // Prepare messages for API (convert to OpenAI format)
      const apiMessages = updatedMessages
        .filter((m) => m.id !== 0) // skip initial greeting
        .map((m) => ({
          role: m.role === "user" ? "user" as const : "assistant" as const,
          content: m.text,
        }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: Date.now() + 1,
        role: "bot",
        text: data.reply || "Извини, произошла ошибка. Попробуй ещё раз!",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", text: "Ошибка связи. Попробуй позже!" },
      ]);
    }

    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-20 right-0 w-[380px] max-h-[560px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "rgba(16, 16, 23, 0.98)",
              border: "1px solid rgba(255, 107, 43, 0.15)",
              boxShadow: "0 0 30px rgba(255, 107, 43, 0.1), 0 25px 60px rgba(0, 0, 0, 0.6)",
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center gap-3 shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(255,107,43,0.1), rgba(168,85,247,0.05))",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--neon-purple)] flex items-center justify-center neon-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-[var(--text-primary)] font-semibold text-sm">ЧЕ Ассистент</div>
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  GPT-4o · Онлайн
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px] max-h-[360px]">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === "bot"
                        ? "bg-gradient-to-br from-[var(--accent)] to-[var(--neon-purple)]"
                        : "bg-[var(--bg-card)]"
                    }`}
                  >
                    {msg.role === "bot" ? (
                      <Bot className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "bot"
                        ? "bg-[var(--bg-card)] text-[var(--text-secondary)] rounded-tl-md"
                        : "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] text-white rounded-tr-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  className="flex gap-2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--neon-purple)] flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-[var(--bg-card)] px-4 py-3 rounded-2xl rounded-tl-md flex gap-1.5">
                    <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 1 && (
              <div className="px-4 pb-3 flex flex-wrap gap-2">
                {QUICK_REPLIES.map((text) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    className="px-3 py-1.5 text-xs rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition-all"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 flex gap-2 shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Задайте вопрос..."
                disabled={isTyping}
                className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center text-white disabled:opacity-30 transition-opacity hover:neon-glow"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white relative"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--neon-purple))",
          boxShadow: "0 0 20px var(--accent-glow), 0 10px 30px rgba(0,0,0,0.3)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!isOpen && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "var(--accent)", opacity: 0.2 }}
          />
        )}
      </motion.button>
    </div>
  );
}
