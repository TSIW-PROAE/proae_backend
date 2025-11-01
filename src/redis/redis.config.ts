import { config } from "dotenv";
import { parse } from "path";

config();

export const redisConfig = () => ({
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_TTL || '259200', 10), // Default to 3 days in seconds
});
