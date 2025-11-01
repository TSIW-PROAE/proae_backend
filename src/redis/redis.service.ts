import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private redisClient: RedisClientType;

    async onModuleInit() {
        this.redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        this.redisClient.on('error', (err) => console.error('Redis Client Error', err));

        await this.redisClient.connect();
        console.log('Connected to Redis');
    }

    async onModuleDestroy() {
        await this.redisClient?.quit();
    }

    async setValue(key: string, value: string, expiration: number = 3 * 24 * 60 * 60): Promise<void> {
        try {
            await this.redisClient.set(key, value, { EX: expiration });

        } catch (error) {
            console.error(`Error setting key ${key}:`, error);
            throw error;
        }
    }

    async getValue(key: string): Promise<any> {
        try {
            return await this.redisClient.get(key);
        } catch (error) {
            console.error(`Error getting key ${key}:`, error);
            return null;
        }
    }

    async deleteValue(key: string): Promise<void> {
        await this.redisClient.del(key);
    }
}
