# Banco PostgreSQL — limpar dados ou zerar tudo

Confira sempre o **`.env`** (qual banco está apontado). Operações são **irreversíveis** sem backup.

---

## Apenas dados (mantém tabelas e migrations)

Remove todas as linhas de **todas as tabelas** do schema `public`, exceto a tabela **`migrations`** (o TypeORM continua sabendo quais migrations já rodaram).

- Estrutura (colunas, FKs, índices) **não** é alterada.
- Sequences / IDs numéricos são **reiniciados** (`RESTART IDENTITY`).

```bash
cd proae_backend
npm run db:truncate-data
```

Implementação: `scripts/truncate-all-data.ts` (usa `TRUNCATE ... CASCADE`).

**MinIO / arquivos:** objetos no storage **não** são apagados (podem ficar órfãos se você apagou só o Postgres).

---

## Apagar tabelas inteiras e recriar o schema (migrations)

Use quando quiser **dropar** as tabelas e subir de novo só com migrations:

```bash
cd proae_backend
npm run db:reset
```

Passos: `schema:drop` → `build` → `migration:run`.

Só dropar, sem recriar:

```bash
npm run schema:drop
```

Depois: `npm run build` e `npm run migration:run` manualmente, se precisar do schema de volta.

---

## Alternativa manual (psql) — só estrutura vazia

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO postgres;
```

Em seguida: `npm run build` e `npm run migration:run`.
