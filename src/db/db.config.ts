import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

function getHost(): string {
  if (process.env.USE_CLOUD_SQL === 'true') {
    if (!process.env.INSTANCE_CONNECTION_NAME) {
      throw new Error('INSTANCE_CONNECTION_NAME não configurado');
    }

    return `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
  }

  return process.env.DB_HOST || 'localhost';
}

function getPort(): number {
  return parseInt(process.env.DB_PORT || '5432', 10);
}

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: getHost(),
  port: getPort(),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
};

export const AppDataSource = new DataSource(typeOrmConfig);
