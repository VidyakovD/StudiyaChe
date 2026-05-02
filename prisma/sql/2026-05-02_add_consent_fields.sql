-- Миграция: согласие на обработку ПДн (152-ФЗ) и подписка на рассылку (38-ФЗ).
-- Добавляются два поля в "User":
--   consentToProcessingAt  TIMESTAMP — когда юзер дал согласие на обработку ПДн.
--                                       NULL = согласия в явном виде нет (легаси).
--   subscribedToNewsletter BOOLEAN  — подписан ли на маркетинговую рассылку.
--                                       Default false: рассылку получают только
--                                       те, кто явно отметил чекбокс при регистрации.
--
-- Применить на проде ОДНИМ из способов:
--   1) `npx prisma db push` — синхронизирует schema.prisma → БД (рекомендуется,
--      добавит поля без потери данных, потому что новые поля nullable / с default).
--   2) Выполнить этот SQL вручную на БД, потом `npx prisma generate`.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "consentToProcessingAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "subscribedToNewsletter" BOOLEAN NOT NULL DEFAULT false;
