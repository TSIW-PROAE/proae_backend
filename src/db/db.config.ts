import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getCloudSqlConnectionOptions } from './cloud-sql-connector';

config();

export async function getTypeOrmConfig(): Promise<DataSourceOptions> {
  const useCloudSql = process.env.USE_CLOUD_SQL === 'true';

  if (useCloudSql) {
    const connectionOptions = await getCloudSqlConnectionOptions();

    return {
      type: 'postgres',
      host: connectionOptions.host,
      port: connectionOptions.port,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/migrations/*.js'],
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
  };
}

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: false,
};

export const AppDataSource = new DataSource(typeOrmConfig);
