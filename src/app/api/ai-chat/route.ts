import { NextRequest, NextResponse } from "next/server";

// Allow self-signed SSL on proxy server
if (process.env.OPENAI_BASE_URL && process.env.OPENAI_BASE_URL.includes("8443")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const SYSTEM_PROMPT = `Ты — ИИ-ассистент обучающей платформы "Студия ЧЕ". Тебя зовут "ЧЕ Ассистент".

ТВОЯ РОЛЬ: Ты эксперт-консультант по видеопроизводству и ИИ-инструментам. Помогаешь пользователям выбрать курс, отвечаешь на вопросы по теме, мотивируешь учиться.

НАПРАВЛЕНИЯ ПЛАТФОРМЫ:
1. ВИДЕОМОНТАЖ — Adobe Premiere Pro, After Effects, DaVinci Resolve, Final Cut Pro. Таймлайн, цветокоррекция, звук, переходы, эффекты, экспорт, кодеки (H.264, H.265, ProRes), разрешения, фреймрейт, многокамерный монтаж.

2. ИИ ГЕНЕРАЦИИ — Runway ML (Gen-2, Gen-3), Midjourney, Stable Diffusion, DALL-E, Sora, Kling, Pika Labs. Генерация видео из текста и изображений, промпт-инжиниринг, стили, параметры, upscale, img2vid, text2vid. Генерация музыки: Suno, Udio.

3. ИИ ДЛЯ БИЗНЕСА — ChatGPT, Claude, автоматизация контента, сценарии, субтитры через Whisper, AI-озвучка (ElevenLabs, HeyGen), чат-боты, воронки продаж, автоматизация видеопродакшена.

КУРСЫ НА ПЛАТФОРМЕ:
- "Основы видеомонтажа в Premiere Pro" — 12 уроков, 4 990 ₽ (для новичков)
- "Продвинутый After Effects" — 18 уроков, 7 990 ₽ (VFX, моушн-дизайн)
- "Генерация видео через Runway ML" — 8 уроков, 5 990 ₽ (ИИ-видео)
- "Midjourney для видеопродакшена" — 10 уроков, 6 490 ₽ (ИИ-графика)
- "ChatGPT для бизнес-контента" — 14 уроков, 8 990 ₽ (автоматизация)
- "ИИ-автоматизация для продакшена" — 16 уроков, 9 990 ₽ (продвинутый)

УСЛОВИЯ: Разовая оплата, доступ навсегда. Никаких подписок. Оплата через ЮKassa. Последовательное прохождение уроков. Есть домашние задания. Общий чат в каждом курсе.

ПРАВИЛА ОТВЕТОВ:
- Отвечай на русском языке
- Будь дружелюбным, лаконичным, по делу
- Используй эмодзи умеренно (1-2 на сообщение)
- Рекомендуй конкретные курсы, когда уместно
- Если вопрос не по теме — вежливо верни к теме видеопроизводства и ИИ
- Максимум 3-4 предложения на ответ
- Не выдумывай курсы, которых нет в списке
- Если спрашивают про цены — называй точные
- Мотивируй людей начать обучение`;

// Send dialog summary to n8n webhook
async function sendToWebhook(messages: { role: string; content: string }[], botReply: string) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "Студия ЧЕ",
        timestamp: new Date().toISOString(),
        userMessages,
        lastQuestion: userMessages[userMessages.length - 1] || "",
        botReply,
        messageCount: messages.length,
      }),
    });
  } catch {
    // Webhook failed silently — don't break chat
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Сообщения обязательны" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API ключ не настроен" }, { status: 500 });
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
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10),
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "Ошибка ИИ сервиса" }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Извини, не смог ответить. Попробуй ещё раз!";

    // Send to n8n in background (don't await — don't slow down response)
    sendToWebhook(messages, reply);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
