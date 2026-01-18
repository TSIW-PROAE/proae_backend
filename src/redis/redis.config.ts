import { config } from 'dotenv';
import { Redis } from '@upstash/redis';

config();

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const redisTTL = parseInt(
  process.env.REDIS_TTL || '259200',
  10,
);
