/**
 * Remove apenas os DADOS de todas as tabelas do schema `public`.
 * Preserva: estrutura das tabelas, índices, FKs e a tabela `migrations` (histórico TypeORM).
 *
 * Uso: npm run db:truncate-data
 */
import 'dotenv/config';
import { Client, ClientConfig } from 'pg';

function getClientConfig(): ClientConfig {
  if (process.env.DB_URL) {
    return {
      connectionString: process.env.DB_URL,
      ssl: { rejectUnauthorized: false },
    };
  }
  if (process.env.USE_CLOUD_SQL === 'true') {
    const conn =
      process.env.INSTANCE_CONNECTION_NAME ||
      process.env.CLOUD_SQL_CONNECTION_NAME;
    return {
      host: `/cloudsql/${conn}`,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }
  const base: ClientConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
  if (process.env.DB_SSL === 'true') {
    base.ssl = { rejectUnauthorized: false };
  }
  return base;
}

async function main() {
  const client = new Client(getClientConfig());
  await client.connect();

  try {
    const { rows } = await client.query<{ tablename: string }>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT IN ('migrations')
      ORDER BY tablename
    `);

    const names = rows.map((r) => r.tablename);
    if (names.length === 0) {
      console.log('Nenhuma tabela de dados para truncar (além de migrations).');
      return;
    }

    const quoted = names.map((n) => `"${n.replace(/"/g, '""')}"`).join(', ');
    await client.query(
      `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`,
    );

    console.log(
      `OK: dados removidos de ${names.length} tabela(s). A tabela "migrations" foi mantida (schema TypeORM inalterado).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
