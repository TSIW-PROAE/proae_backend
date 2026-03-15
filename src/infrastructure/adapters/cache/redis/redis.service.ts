import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import type { CachePort } from '../../../../core/application/utilities/ports/cache.port';

const REDIS_CHECKLIST = [
  'UPSTASH_REDIS_REST_URL (ex: https://xxx.upstash.io)',
  'UPSTASH_REDIS_REST_TOKEN',
  'Rede/firewall permitindo acesso ao Upstash',
  'URL sem barra no final',
].join('; ');

function formatRedisError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(msg)) {
    return `Redis indisponível (${msg}). Verifique: ${REDIS_CHECKLIST}`;
  }
  if (/unauthorized|401|token/i.test(msg)) {
    return `Redis: token inválido ou não autorizado. Verifique UPSTASH_REDIS_REST_TOKEN. Detalhe: ${msg}`;
  }
  return `Redis: ${msg}. Verifique: ${REDIS_CHECKLIST}`;
}

@Injectable()
export class RedisService implements OnModuleInit, CachePort {
  private redis: Redis | null = null;

  onModuleInit() {
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      console.warn('⚠️ Upstash Redis não configurado. Cache desabilitado.');
      return;
    }

    const url = process.env.UPSTASH_REDIS_REST_URL.trim();
    if (url.endsWith('/')) {
      console.warn(
        '⚠️ UPSTASH_REDIS_REST_URL não deve terminar com /. Remova a barra final.',
      );
    }

    this.redis = new Redis({
      url,
      token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
    });

    console.log('✅ Redis configurado. Testando conectividade...');
    this.redis
      .ping()
      .then(() => console.log('✅ Redis conectado (ping OK).'))
      .catch((err: unknown) => {
        console.error(
          '❌ Redis: falha na conectividade. As requisições que usam cache vão falhar até corrigir.',
        );
        console.error(formatRedisError(err));
      });
  }

  /**
   * Executa chamada ao Redis com retry. Em falha, lança erro com mensagem acionável.
   */
  private async safeCall<T>(
    fn: (client: Redis) => Promise<T>,
    retries = 2,
    delayMs = 800,
  ): Promise<T> {
    if (!this.redis) {
      throw new Error(
        'Redis não inicializado. Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN.',
      );
    }

    let lastErr: unknown;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn(this.redis);
      } catch (err: unknown) {
        lastErr = err;
        console.error(
          `[Redis] Tentativa ${attempt}/${retries} falhou:`,
          err instanceof Error ? err.message : err,
        );
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }

    const message = formatRedisError(lastErr);
    console.error('[Redis]', message);
    throw new Error(message);
  }

  async setValue(
    key: string,
    value: unknown,
    expirationSeconds = 3 * 24 * 60 * 60,
  ): Promise<void> {
    if (!this.redis) return;
    await this.safeCall((client) =>
      client.set(key, value, { ex: expirationSeconds }),
    );
  }

  async getValue<T = unknown>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    const result = await this.safeCall((client) => client.get<T>(key));
    return result ?? null;
  }

  async deleteValue(key: string): Promise<void> {
    if (!this.redis) return;
    await this.safeCall((client) => client.del(key));
  }
}
