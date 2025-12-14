import { CloudSQLConnector } from '@google-cloud/cloud-sql-connector';

let connector: CloudSQLConnector | null = null;

export async function getCloudSqlConnectionOptions(): Promise<{
  host: string;
  port: number;
}> {
  if (!process.env.CLOUD_SQL_CONNECTION_NAME) {
    throw new Error('CLOUD_SQL_CONNECTION_NAME não configurado');
  }

  if (!connector) {
    connector = new CloudSQLConnector();
  }

  const opts = await connector.getOptions({
    instanceConnectionName: process.env.CLOUD_SQL_CONNECTION_NAME,
    ipType: 'PRIVATE',
  });

  return {
    host: opts.host || 'localhost',
    port: opts.port || 5432,
  };
}

export async function closeCloudSqlConnector() {
  if (connector) {
    await connector.close();
    connector = null;
  }
}

