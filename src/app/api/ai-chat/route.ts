import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Прокси для ИИ чат-бота.
 *
 * Режим 1 (N8N_CHAT_WEBHOOK_URL задан):
 *   Сайт → n8n (формирует ответ через GPT + логика) → сайт
 *   n8n сам решает когда диалог окончен и формирует резюме
 *
 * Режим 2 (fallback, если n8n не настроен):
 *   Сайт → OpenAI напрямую (без custom TLS-агента — прокси с самоподписанным
 *   сертификатом больше не поддерживается, чтобы не тащить undici как dep
 *   и не зависеть от Node 21+).
 */

// Fallback system prompt (используется только если n8n не настроен)
const FALLBACK_SYSTEM_PROMPT = `Ты — ИИ-ассистент обучающей платформы "Студия ЧЕ". Тебя зовут "ЧЕ Ассистент".
Ты эксперт по видеопроизводству, ИИ-генерации и ИИ для бизнеса.
Курсы: Premiere Pro (4990₽), After Effects (7990₽), Runway ML (5990₽), Midjourney (6490₽), ChatGPT для бизнеса (8990₽), ИИ-автоматизация (9990₽).
Разовая оплата, доступ навсегда. Отвечай кратко, на русском, дружелюбно.`;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitizeMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const cleaned: ChatMessage[] = [];
  for (const m of input.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    // Никаких system/tool ролей от клиента — только user/assistant.
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    cleaned.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, event } = body;

    const messages = sanitizeMessages(body.messages);
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Сообщения обязательны" }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_CHAT_WEBHOOK_URL;

    // === РЕЖИМ 1: Через n8n ===
    if (n8nUrl) {
      // n8n за nginx с CORS-фильтром: server-to-server fetch не шлёт Origin
      // и n8n отвечает 403 origin_not_allowed. Подкладываем Origin вручную,
      // используя origin самого webhook-URL — тогда CORS-белый список совпадёт.
      let n8nOrigin = "";
      try {
        n8nOrigin = new URL(n8nUrl).origin;
      } catch {
        // битый URL — fetch ниже всё равно упадёт, ловится в общем catch.
      }
      const n8nResponse = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(n8nOrigin ? { Origin: n8nOrigin } : {}),
        },
        body: JSON.stringify({
          // Данные для n8n
          sessionId: sessionId || `session_${Date.now()}`,
          event: event || "message", // "message" | "end" (конец диалога)
          messages, // Полная история диалога [{role, content}]
          lastMessage: messages[messages.length - 1]?.content || "",
          timestamp: new Date().toISOString(),
          platform: "Студия ЧЕ",
          source: "website_chat",
        }),
      });

      if (!n8nResponse.ok) {
        console.error("n8n error:", await n8nResponse.text());
        return NextResponse.json({ error: "Ошибка ИИ сервиса" }, { status: 502 });
      }

      const n8nData = await n8nResponse.json();

      // n8n должен вернуть { reply: "текст ответа" }
      // Может также вернуть { reply, action, data } для доп. действий
      return NextResponse.json({
        reply: n8nData.reply || n8nData.output || n8nData.text || n8nData.message || "Не удалось получить ответ",
      });
    }

    // === РЕЖИМ 2: Fallback — прямое обращение к OpenAI ===
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ИИ сервис не настроен" }, { status: 500 });
    }

    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: FALLBACK_SYSTEM_PROMPT },
          ...messages.slice(-10),
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI error:", await response.text());
      return NextResponse.json({ error: "Ошибка ИИ сервиса" }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Извини, не смог ответить. Попробуй ещё раз!";

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("AI chat error:", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
