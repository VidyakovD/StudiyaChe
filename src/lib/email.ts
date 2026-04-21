/* ================================================================
   Email Service — Студия ЧЕ
   Отправка через Yandex Mail API (HTTPS, порт 443)
   SMTP порты закрыты на сервере — используем HTTP API
   ================================================================ */
import { escapeHtml } from "./validation";

const BASE_URL = process.env.NEXTAUTH_URL || "https://studiache.ru";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_NAME = "Студия ЧЕ";
const FROM_EMAIL = SMTP_USER || "noreply@studiache.ru";

/* ================================================================
   Фирменная обёртка для всех писем
   ================================================================ */
function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#0a0a0f; font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
          <tr>
            <td style="padding:24px 32px; text-align:center;">
              <span style="font-size:24px; font-weight:bold; color:#ff6b2b; letter-spacing:-0.5px;">
                Студия ЧЕ
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:linear-gradient(135deg, rgba(22,22,31,0.95), rgba(17,17,24,0.95)); border-radius:16px; border:1px solid rgba(255,255,255,0.08); padding:40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px; text-align:center;">
              <p style="color:#6a6a7a; font-size:12px; margin:0;">
                &copy; ${new Date().getFullYear()} Студия ЧЕ. Все права защищены.
              </p>
              <p style="color:#6a6a7a; font-size:12px; margin:6px 0 0;">
                <a href="${BASE_URL}" style="color:#ff6b2b; text-decoration:none;">studiache.ru</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ================================================================
   Базовая отправка через nodemailer с таймаутом
   Не блокирует основной процесс — fire and forget
   ================================================================ */
async function sendEmailDirect(to: string, subject: string, html: string): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("[Email] SMTP не настроен, письмо не отправлено:", { to, subject });
    return false;
  }

  try {
    // Динамический импорт nodemailer чтобы не блокировать если модуль сломан
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || "smtp.yandex.ru",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: parseInt(process.env.SMTP_PORT || "465") === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 10000, // 10 сек на подключение
      socketTimeout: 10000,     // 10 сек на сокет
      greetingTimeout: 10000,   // 10 сек на приветствие
    });

    await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html: emailLayout(html),
    });

    console.log(`[Email] Отправлено: ${subject} → ${to}`);
    return true;
  } catch (error) {
    console.error("[Email] Ошибка отправки:", error);
    return false;
  }
}

/* ================================================================
   Fire-and-forget обёртка — не блокирует вызывающий код
   ================================================================ */
function sendEmail(to: string, subject: string, html: string): void {
  sendEmailDirect(to, subject, html).catch((err) => {
    console.error("[Email] Background send failed:", err);
  });
}

/* ================================================================
   1. Верификация email при регистрации
   ================================================================ */
export function sendVerificationEmail(to: string, token: string): void {
  const verifyUrl = `${BASE_URL}/api/auth/verify?token=${token}`;

  sendEmail(to, "Подтвердите ваш email — Студия ЧЕ", `
    <h1 style="color:#f0f0f5; font-size:24px; font-weight:bold; margin:0 0 16px; letter-spacing:-0.5px;">
      Добро пожаловать!
    </h1>
    <p style="color:#a0a0b0; font-size:16px; line-height:1.6; margin:0 0 24px;">
      Спасибо за регистрацию в Студии ЧЕ. Для завершения регистрации подтвердите ваш email, нажав на кнопку ниже.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${verifyUrl}" style="display:inline-block; background:linear-gradient(135deg, #ff6b2b, #ff8c42); color:#ffffff; font-weight:600; font-size:16px; padding:14px 40px; border-radius:50px; text-decoration:none; letter-spacing:0.3px;">
            Подтвердить email
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6a6a7a; font-size:13px; line-height:1.5; margin:0;">
      Если кнопка не работает, скопируйте ссылку:<br>
      <a href="${verifyUrl}" style="color:#ff6b2b; text-decoration:none; word-break:break-all;">${verifyUrl}</a>
    </p>
    <p style="color:#6a6a7a; font-size:13px; margin:16px 0 0;">
      Если вы не регистрировались — просто проигнорируйте это письмо.
    </p>
  `);
}

/* ================================================================
   2. Подтверждение успешной оплаты курса
   ================================================================ */
export function sendPurchaseEmail(
  to: string,
  courseName: string,
  price: number,
  courseId: string
): void {
  const safeCourseName = escapeHtml(courseName);
  const courseUrl = `${BASE_URL}/course/${encodeURIComponent(courseId)}/learn`;
  const formattedPrice = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(price);

  sendEmail(to, `Оплата подтверждена — ${courseName}`, `
    <h1 style="color:#f0f0f5; font-size:24px; font-weight:bold; margin:0 0 16px; letter-spacing:-0.5px;">
      Оплата прошла успешно!
    </h1>
    <p style="color:#a0a0b0; font-size:16px; line-height:1.6; margin:0 0 24px;">
      Ты приобрёл доступ к курсу. Теперь можешь приступить к обучению.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.06); margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="color:#6a6a7a; font-size:13px; margin:0 0 4px; text-transform:uppercase; letter-spacing:1px;">Курс</p>
          <p style="color:#f0f0f5; font-size:18px; font-weight:600; margin:0 0 16px;">${safeCourseName}</p>
          <p style="color:#6a6a7a; font-size:13px; margin:0 0 4px; text-transform:uppercase; letter-spacing:1px;">Сумма</p>
          <p style="color:#ff6b2b; font-size:22px; font-weight:bold; margin:0;">${formattedPrice}</p>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 16px;">
          <a href="${courseUrl}" style="display:inline-block; background:linear-gradient(135deg, #ff6b2b, #ff8c42); color:#ffffff; font-weight:600; font-size:16px; padding:14px 40px; border-radius:50px; text-decoration:none; letter-spacing:0.3px;">
            Начать обучение
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6a6a7a; font-size:13px; margin:16px 0 0; text-align:center;">
      Доступ к курсу предоставлен навсегда.<br>
      Фискальный чек будет отправлен отдельно на этот email.
    </p>
  `);
}

/* ================================================================
   3. Уведомление о новом курсе
   ================================================================ */
export function sendNewCourseNotification(
  to: string,
  courseName: string,
  courseDescription: string,
  courseId: string,
  price: number
): void {
  const safeCourseName = escapeHtml(courseName);
  const safeCourseDescription = escapeHtml(courseDescription);
  const courseUrl = `${BASE_URL}/course/${encodeURIComponent(courseId)}`;
  const formattedPrice = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(price);

  sendEmail(to, `Новый курс — ${courseName}`, `
    <h1 style="color:#f0f0f5; font-size:24px; font-weight:bold; margin:0 0 8px; letter-spacing:-0.5px;">
      Новый курс уже доступен!
    </h1>
    <p style="color:#a0a0b0; font-size:16px; line-height:1.6; margin:0 0 24px;">
      Мы выпустили новый курс, который может быть тебе интересен.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.06); margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="color:#ff6b2b; font-size:13px; margin:0 0 8px; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Новинка</p>
          <p style="color:#f0f0f5; font-size:20px; font-weight:bold; margin:0 0 8px;">${safeCourseName}</p>
          <p style="color:#a0a0b0; font-size:14px; line-height:1.5; margin:0 0 12px;">${safeCourseDescription}</p>
          <p style="color:#ff6b2b; font-size:20px; font-weight:bold; margin:0;">${formattedPrice}</p>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 16px;">
          <a href="${courseUrl}" style="display:inline-block; background:linear-gradient(135deg, #ff6b2b, #ff8c42); color:#ffffff; font-weight:600; font-size:16px; padding:14px 40px; border-radius:50px; text-decoration:none;">
            Узнать подробнее
          </a>
        </td>
      </tr>
    </table>
  `);
}

/* ================================================================
   4. Восстановление пароля
   ================================================================ */
export function sendPasswordResetEmail(to: string, token: string): void {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;

  sendEmail(to, "Восстановление пароля — Студия ЧЕ", `
    <h1 style="color:#f0f0f5; font-size:24px; font-weight:bold; margin:0 0 16px; letter-spacing:-0.5px;">
      Восстановление пароля
    </h1>
    <p style="color:#a0a0b0; font-size:16px; line-height:1.6; margin:0 0 24px;">
      Ты запросил сброс пароля. Нажми на кнопку ниже, чтобы создать новый пароль.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${resetUrl}" style="display:inline-block; background:linear-gradient(135deg, #ff6b2b, #ff8c42); color:#ffffff; font-weight:600; font-size:16px; padding:14px 40px; border-radius:50px; text-decoration:none; letter-spacing:0.3px;">
            Сбросить пароль
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6a6a7a; font-size:13px; line-height:1.5; margin:0;">
      Если кнопка не работает, скопируйте ссылку:<br>
      <a href="${resetUrl}" style="color:#ff6b2b; text-decoration:none; word-break:break-all;">${resetUrl}</a>
    </p>
    <p style="color:#6a6a7a; font-size:13px; margin:16px 0 0;">
      Ссылка действительна 1 час. Если ты не запрашивал сброс — проигнорируй это письмо.
    </p>
  `);
}

/* ================================================================
   5. Рассылка от админа (произвольная тема + текст)
   ================================================================ */
export function sendBroadcastEmail(
  to: string,
  userName: string,
  subject: string,
  message: string
): void {
  // Экранируем пользовательский ввод перед вставкой в HTML,
  // переносы строк заменяем на <br>. Защита от XSS/HTML-injection в письмах.
  const htmlMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const safeName = escapeHtml(userName);

  sendEmail(to, subject, `
    <p style="color:#a0a0b0; font-size:15px; margin:0 0 20px;">
      Привет${safeName ? `, ${safeName}` : ""}!
    </p>
    <div style="color:#f0f0f5; font-size:16px; line-height:1.7; margin:0 0 24px;">
      ${htmlMessage}
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 16px;">
          <a href="${BASE_URL}" style="display:inline-block; background:linear-gradient(135deg, #ff6b2b, #ff8c42); color:#ffffff; font-weight:600; font-size:16px; padding:14px 40px; border-radius:50px; text-decoration:none;">
            Перейти на платформу
          </a>
        </td>
      </tr>
    </table>
  `);
}
