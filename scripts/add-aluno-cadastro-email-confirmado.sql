-- Execute no Postgres se o login falhar com "column ... cadastro_email_confirmado does not exist"
-- (migration equivalente: npm run migration:run)

ALTER TABLE "aluno"
  ADD COLUMN IF NOT EXISTS "cadastro_email_confirmado" boolean NOT NULL DEFAULT true;
