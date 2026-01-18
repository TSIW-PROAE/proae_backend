import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private redis: Redis;

  onModuleInit() {
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      console.warn(
        '⚠️ Upstash Redis não configurado. Cache desabilitado.',
      );
      return;
    }

    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    console.log('✅ Connected to Upstash Redis (REST)');
  }

  async setValue(
    key: string,
    value: any,
    expirationSeconds = 3 * 24 * 60 * 60,
  ): Promise<void> {
    if (!this.redis) return;

    await this.redis.set(key, value, {
      ex: expirationSeconds,
    });
  }

  async getValue<T = any>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    return this.redis.get<T>(key);
  }

  async deleteValue(key: string): Promise<void> {
    if (!this.redis) return;

    await this.redis.del(key);
  }
}
