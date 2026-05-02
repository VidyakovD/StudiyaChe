// IP-диапазоны, с которых приходят webhook-ы ЮKassa.
// Источник: https://yookassa.ru/developers/using-api/webhooks#ip
// Можно переопределить через ENV YUKASSA_WEBHOOK_IPS (CSV CIDR/одиночных IP),
// если ЮKassa расширит список — без релиза приложения.
const DEFAULT_YUKASSA_CIDRS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.154.128/25",
  "77.75.156.11",
  "77.75.156.35",
  "2a02:5180::/32",
];

function getCidrs(): string[] {
  const env = process.env.YUKASSA_WEBHOOK_IPS;
  if (env && env.trim()) {
    return env
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_YUKASSA_CIDRS;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  // >>> 0 чтобы привести к unsigned 32-bit
  return n >>> 0;
}

function matchIpv4Cidr(ip: string, cidr: string): boolean {
  const [base, prefixStr] = cidr.split("/");
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null) return false;
  const prefix = prefixStr === undefined ? 32 : Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  if (prefix === 0) return true;
  // Маска: prefix старших бит равны 1, остальные 0.
  const mask = prefix === 32 ? 0xffffffff : (~((1 << (32 - prefix)) - 1)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

// IPv6: грубая проверка по префиксу. Ограничение — поддерживается только
// случай "::"-сжатия в начале/середине, но для матчинга к 2a02:5180::/32
// этого достаточно (мы сравниваем ровно первые 32 бита = 2 группы hex).
function ipv6ToBytes(ip: string): Uint8Array | null {
  // Срезаем zone-id (после "%")
  const cleaned = ip.split("%")[0];
  if (!cleaned.includes(":")) return null;

  const parts = cleaned.split("::");
  if (parts.length > 2) return null;

  const expand = (s: string): string[] => (s ? s.split(":") : []);
  const left = expand(parts[0]);
  const right = parts.length === 2 ? expand(parts[1]) : [];
  const missing = 8 - (left.length + right.length);
  if (missing < 0) return null;
  const groups = [...left, ...new Array(missing).fill("0"), ...right];
  if (groups.length !== 8) return null;

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 8; i++) {
    const g = groups[i];
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    const v = parseInt(g, 16);
    bytes[i * 2] = (v >> 8) & 0xff;
    bytes[i * 2 + 1] = v & 0xff;
  }
  return bytes;
}

function matchIpv6Cidr(ip: string, cidr: string): boolean {
  const [base, prefixStr] = cidr.split("/");
  const ipBytes = ipv6ToBytes(ip);
  const baseBytes = ipv6ToBytes(base);
  if (!ipBytes || !baseBytes) return false;
  const prefix = prefixStr === undefined ? 128 : Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) return false;
  const fullBytes = Math.floor(prefix / 8);
  const remBits = prefix % 8;
  for (let i = 0; i < fullBytes; i++) {
    if (ipBytes[i] !== baseBytes[i]) return false;
  }
  if (remBits !== 0) {
    const mask = (0xff << (8 - remBits)) & 0xff;
    if ((ipBytes[fullBytes] & mask) !== (baseBytes[fullBytes] & mask)) return false;
  }
  return true;
}

export function isYukassaIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const cidrs = getCidrs();
  const isV6 = ip.includes(":");
  for (const cidr of cidrs) {
    const cidrIsV6 = cidr.includes(":");
    if (isV6 !== cidrIsV6) continue;
    const ok = isV6 ? matchIpv6Cidr(ip, cidr) : matchIpv4Cidr(ip, cidr);
    if (ok) return true;
  }
  return false;
}

// Проверка включена ТОЛЬКО если YUKASSA_VERIFY_IP=true в env.
// Так настройка Nginx (set_real_ip_from / X-Forwarded-For) не превращает
// первый деплой в кирпич: сначала включают флаг, когда убедились что
// заголовок прокидывается корректно.
export function isYukassaIpCheckEnabled(): boolean {
  return process.env.YUKASSA_VERIFY_IP === "true";
}
