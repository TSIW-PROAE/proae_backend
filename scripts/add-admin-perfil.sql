-- Execute no Postgres antes de subir o backend com perfis de acesso de admin.
-- (migration equivalente: npm run migration:generate && npm run migration:run)
--
-- Cria a coluna "perfil" na tabela admin e define um valor seguro para registros existentes.
-- Valores aceitos: 'tecnico' | 'gerencial' | 'coordenacao'.

ALTER TABLE "admin"
  ADD COLUMN IF NOT EXISTS "perfil" varchar(20) NOT NULL DEFAULT 'gerencial';

-- Garante que registros legados que ficaram com NULL ou vazio recebam o default.
UPDATE "admin"
   SET "perfil" = 'gerencial'
 WHERE "perfil" IS NULL OR TRIM("perfil") = '';
