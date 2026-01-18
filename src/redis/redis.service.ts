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
      console.warn('⚠️ Upstash Redis não configurado. Cache desabilitado.');
      return;
    }

    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    console.log('✅ Connected to Upstash Redis (REST)');
  }

  // Wrapper seguro para qualquer operação Redis
  private async safeCall<T>(
    fn: (client: Redis) => Promise<T>,
    retries = 3,
    delayMs = 2000,
  ): Promise<T> {
    if (!this.redis) throw new Error('Redis não inicializado');

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn(this.redis);
      } catch (err: any) {
        console.error(
          `⚠️ Redis request failed (attempt ${attempt}/${retries}):`,
          err.message,
        );
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw new Error('RedisSafeCall failed unexpectedly');
  }

  async setValue(
    key: string,
    value: any,
    expirationSeconds = 3 * 24 * 60 * 60,
  ): Promise<void> {
    if (!this.redis) return;
    await this.safeCall((client) =>
      client.set(key, value, { ex: expirationSeconds }),
    );
  }

  async getValue<T = any>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    return this.safeCall((client) => client.get<T>(key));
  }

  async deleteValue(key: string): Promise<void> {
    if (!this.redis) return;
    await this.safeCall((client) => client.del(key));
  }
}
