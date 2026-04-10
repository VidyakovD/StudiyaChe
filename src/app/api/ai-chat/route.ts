import { NextRequest, NextResponse } from "next/server";

/**
 * Прокси для ИИ чат-бота.
 *
 * Режим 1 (N8N_CHAT_WEBHOOK_URL задан):
 *   Сайт → n8n (формирует ответ через GPT + логика) → сайт
 *   n8n сам решает когда диалог окончен и формирует резюме
 *
 * Режим 2 (fallback, если n8n не настроен):
 *   Сайт → OpenAI напрямую через прокси
 */

// Fallback system prompt (используется только если n8n не настроен)
const FALLBACK_SYSTEM_PROMPT = `Ты — ИИ-ассистент обучающей платформы "Студия ЧЕ". Тебя зовут "ЧЕ Ассистент".
Ты эксперт по видеопроизводству, ИИ-генерации и ИИ для бизнеса.
Курсы: Premiere Pro (4990₽), After Effects (7990₽), Runway ML (5990₽), Midjourney (6490₽), ChatGPT для бизнеса (8990₽), ИИ-автоматизация (9990₽).
Разовая оплата, доступ навсегда. Отвечай кратко, на русском, дружелюбно.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId, event } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Сообщения обязательны" }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_CHAT_WEBHOOK_URL;

    // === РЕЖИМ 1: Через n8n ===
    if (n8nUrl) {
      const n8nResponse = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    // Allow self-signed SSL on proxy
    if (process.env.OPENAI_BASE_URL?.includes("8443")) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
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
