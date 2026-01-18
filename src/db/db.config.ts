import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

interface ParsedDatabaseUrl {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/**
 * Parse DATABASE_URL format: postgresql://user:password@host:port/database
 * Suporta Railway, Render e outros serviços que fornecem DATABASE_URL
 */
function parseDatabaseUrl(): ParsedDatabaseUrl | null {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return null;
  }

  try {
    // Suporta tanto postgresql:// quanto postgres://
    const url = databaseUrl.replace(/^postgres:/, 'postgresql:');
    const parsedUrl = new URL(url);
    
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port || '5432', 10),
      username: parsedUrl.username,
      password: parsedUrl.password,
      database: parsedUrl.pathname.slice(1), // Remove a barra inicial
    };
  } catch (error) {
    console.error('Erro ao parsear DATABASE_URL:', error);
    return null;
  }
}

function getHost(): string {
  // GCP Cloud SQL usa socket path
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

function buildTypeOrmConfig(): DataSourceOptions {
  // Prioridade 1: DATABASE_URL (Railway, Render, etc)
  const parsedUrl = parseDatabaseUrl();
  
  if (parsedUrl) {
    // Para serviços como Render e Railway, geralmente precisam de SSL
    // Detecta automaticamente se é um host remoto (não localhost)
    const isRemoteHost = parsedUrl.host !== 'localhost' && 
                         parsedUrl.host !== '127.0.0.1' &&
                         !parsedUrl.host.startsWith('/');
    
    return {
      type: 'postgres',
      host: parsedUrl.host || 'localhost',
      port: parsedUrl.port || 5432,
      username: parsedUrl.username || '',
      password: parsedUrl.password || '',
      database: parsedUrl.database || '',
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/migrations/*.js'],
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
      // SSL automático para hosts remotos ou quando DB_SSL=true
      ...((isRemoteHost || process.env.DB_SSL === 'true') && {
        ssl: { rejectUnauthorized: false },
      }),
      // Retry logic para conexões
      connectTimeoutMS: 10000,
      extra: {
        max: 10,
        connectionTimeoutMillis: 10000,
      },
    };
  }

  // Prioridade 2: Variáveis individuais ou GCP Cloud SQL
  const host = getHost();
  const port = getPort();
  
  // Detecta se é host remoto para SSL automático
  // Render, Railway e outros serviços cloud geralmente precisam de SSL
  const isRemoteHost = host !== 'localhost' && 
                       host !== '127.0.0.1' &&
                       !host.startsWith('/') &&
                       (host.includes('.render.com') ||
                        host.includes('.railway.app') ||
                        host.includes('.amazonaws.com') ||
                        host.includes('.cloud') ||
                        /^\d+\.\d+\.\d+\.\d+$/.test(host)); // IPs também são remotos
  
  // Para GCP Cloud SQL, não usar porta (usa socket)
  return {
    type: 'postgres',
    host,
    ...(process.env.USE_CLOUD_SQL !== 'true' && { port }),
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
    // SSL automático para hosts remotos ou quando DB_SSL=true
    // Render sempre precisa de SSL para conexões externas
    ...((isRemoteHost || process.env.DB_SSL === 'true') && {
      ssl: { rejectUnauthorized: false },
    }),
    // Retry logic para conexões
    connectTimeoutMS: 10000,
    extra: {
      max: 10,
      connectionTimeoutMillis: 10000,
    },
  };
}

export const typeOrmConfig: DataSourceOptions = buildTypeOrmConfig();

export const AppDataSource = new DataSource(typeOrmConfig);
