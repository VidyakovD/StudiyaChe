-- Миграция: соответствие 152-ФЗ / 38-ФЗ + срок жизни verify-токена + paymentId.
--
-- Поля в "User":
--   consentToProcessingAt  TIMESTAMP — момент явного согласия на обработку ПДн
--                                       (NULL = согласия в явном виде нет).
--   subscribedToNewsletter BOOLEAN  — подписка на маркетинговую рассылку (38-ФЗ).
--                                       Default false: только явная подписка.
--   verifyTokenExp         TIMESTAMP — срок жизни токена подтверждения email.
--                                       NULL у легаси-токенов = считаем
--                                       просроченным (см. verify route).
--
-- Поле в "Purchase":
--   paymentId              TEXT @unique — внешний id платежа ЮKassa,
--                                       строгая идемпотентность webhook-а.
--
-- Применить на проде ОДНИМ из способов:
--   1) `npx prisma db push` — синхронизирует schema.prisma → БД (рекомендуется,
--      добавит поля без потери данных, потому что новые поля nullable / с default).
--   2) Выполнить этот SQL вручную, потом `npx prisma generate`.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "consentToProcessingAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "subscribedToNewsletter" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verifyTokenExp"         TIMESTAMP(3);

ALTER TABLE "Purchase"
  ADD COLUMN IF NOT EXISTS "paymentId" TEXT;

-- Уникальность paymentId — отдельным индексом, чтобы добавление было идемпотентным.
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_paymentId_key" ON "Purchase"("paymentId");
