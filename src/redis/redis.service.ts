import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private redisClient: RedisClientType;

    async onModuleInit() {
        // Construir URL do Redis com suporte a senha
        let redisUrl = process.env.REDIS_URL;
        
        if (!redisUrl) {
            // Se não tem REDIS_URL, construir a partir de variáveis individuais
            const host = process.env.REDIS_HOST || 'localhost';
            const port = process.env.REDIS_PORT || '6379';
            const password = process.env.REDIS_PASSWORD;
            
            if (password) {
                // Formato: redis://:password@host:port
                redisUrl = `redis://:${password}@${host}:${port}`;
            } else {
                redisUrl = `redis://${host}:${port}`;
            }
        } else {
            // Se tem REDIS_URL mas também tem REDIS_PASSWORD separado, usar o password
            // (útil quando a URL não inclui senha mas temos ela em variável separada)
            const password = process.env.REDIS_PASSWORD;
            if (password && !redisUrl.includes('@') && !redisUrl.includes('://:')) {
                // Se a URL não tem senha mas temos REDIS_PASSWORD, adicionar
                redisUrl = redisUrl.replace('redis://', `redis://:${password}@`);
            }
        }

        const clientConfig: any = {
            url: redisUrl,
        };

        // Se temos senha separada e não está na URL, usar password diretamente
        if (process.env.REDIS_PASSWORD && !redisUrl.includes('@')) {
            clientConfig.password = process.env.REDIS_PASSWORD;
        }

        this.redisClient = createClient(clientConfig);

        this.redisClient.on('error', (err) => console.error('Redis Client Error', err));

        try {
            await this.redisClient.connect();
            console.log('Connected to Redis');
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            // Não lançar erro para não quebrar a aplicação se Redis não estiver disponível
            // A aplicação pode funcionar sem Redis em alguns casos
        }
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
        try {
            await this.redisClient.del(key);
        } catch (error) {
            console.error(`Error deleting key ${key}:`, error);
            throw error;
        }
    }
}
