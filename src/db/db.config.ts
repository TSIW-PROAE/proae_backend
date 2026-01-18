import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

function buildTypeOrmConfig(): DataSourceOptions {
  if (process.env.DB_URL) {
    return {
      type: 'postgres',
      url: process.env.DB_URL,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
        max: 5,
      },
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/migrations/*.js'],
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
    };
  }
  if (process.env.USE_CLOUD_SQL === 'true') {
    return {
      type: 'postgres',
      host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
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
    ...(process.env.DB_SSL === 'true' && {
      ssl: { rejectUnauthorized: false },
    }),
  };
}

export const typeOrmConfig: DataSourceOptions = buildTypeOrmConfig();
export const AppDataSource = new DataSource(typeOrmConfig);
