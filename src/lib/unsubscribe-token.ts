import { createHmac, timingSafeEqual } from "node:crypto";

// Токен для one-click unsubscribe в маркетинговых письмах (38-ФЗ).
// Идея: подписываем email через HMAC-SHA256(NEXTAUTH_SECRET).
// В БД хранить ничего не нужно — токен самопроверяемый.
//
// Формат: base64url(email) + "." + base64url(hmac)

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

export function signUnsubscribeToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const payload = toBase64Url(Buffer.from(normalized, "utf8"));
  const sig = createHmac("sha256", getSecret()).update(normalized).digest();
  const sigB64 = toBase64Url(sig);
  return `${payload}.${sigB64}`;
}

// Возвращает email при валидной подписи, null — при невалидной/повреждённой.
// Используется timingSafeEqual чтобы не открывать таймингом длину совпадающего префикса.
export function verifyUnsubscribeToken(token: string): string | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  let email: string;
  try {
    email = fromBase64Url(payloadB64).toString("utf8");
  } catch {
    return null;
  }
  if (!email || email.length > 254) return null;

  const expected = createHmac("sha256", getSecret()).update(email).digest();
  let actual: Buffer;
  try {
    actual = fromBase64Url(sigB64);
  } catch {
    return null;
  }
  if (actual.length !== expected.length) return null;
  if (!timingSafeEqual(actual, expected)) return null;
  return email;
}
