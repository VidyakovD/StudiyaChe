import { createHmac, timingSafeEqual } from "node:crypto";

// Токен подтверждения регистрации.
//
// Идея: User в БД НЕ создаётся в момент POST /api/auth/register.
// Все данные запроса (email, имя, bcrypt-хеш пароля, флаги согласий)
// упаковываются в подписанный токен и кладутся в URL письма.
// Только когда юзер кликает по ссылке — verify декодирует токен
// и создаёт User в БД.
//
// Что это даёт:
//   * незаконченные регистрации не оседают в БД (152-ФЗ: данные
//     обрабатываются только после явного подтверждения)
//   * нет email-enumeration через POST /register (база не трогается)
//   * не нужны cron-cleanup'ы для висящих токенов
//
// Безопасность: payload подписан HMAC-SHA256(NEXTAUTH_SECRET).
// Подделать токен без секрета невозможно. Перехват токена даёт
// атакующему только возможность запустить verify (создать аккаунт),
// но без знания исходного пароля логин невозможен — пароль атакующий
// не получает (в токене лежит уже захешированный bcrypt).

export type RegistrationPayload = {
  email: string;
  passwordHash: string;
  name: string;
  agreeNewsletter: boolean;
  // Момент клика по чекбоксу согласия — для аудита 152-ФЗ.
  consentAt: number; // unix ms
  // Срок жизни токена (тоже unix ms).
  exp: number;
};

const TTL_MS = 24 * 60 * 60 * 1000; // 24 часа

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET не задан");
  return s;
}

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signRegistrationToken(
  data: Omit<RegistrationPayload, "exp">
): string {
  const payload: RegistrationPayload = { ...data, exp: Date.now() + TTL_MS };
  const json = JSON.stringify(payload);
  const payloadB64 = toBase64Url(Buffer.from(json, "utf8"));
  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${toBase64Url(sig)}`;
}

export function verifyRegistrationToken(token: string): RegistrationPayload | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  const expected = createHmac("sha256", getSecret()).update(payloadB64).digest();
  let actual: Buffer;
  try {
    actual = fromBase64Url(sigB64);
  } catch {
    return null;
  }
  if (actual.length !== expected.length) return null;
  if (!timingSafeEqual(actual, expected)) return null;

  let payload: RegistrationPayload;
  try {
    payload = JSON.parse(fromBase64Url(payloadB64).toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof payload.email !== "string" ||
    typeof payload.passwordHash !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.agreeNewsletter !== "boolean" ||
    typeof payload.consentAt !== "number" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  if (payload.exp < Date.now()) return null;
  // Чисто sanity-проверки длины, чтобы кривой payload не дошёл до Prisma.
  if (payload.email.length > 254 || payload.name.length > 100) return null;
  if (payload.passwordHash.length < 50 || payload.passwordHash.length > 100) return null;

  return payload;
}
