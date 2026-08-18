import { createClient } from 'redis';
import { env } from '@/config/env.config';

export const redis = createClient({
  url: env.REDIS_URL
});

redis.on('error', (err) => console.error('Redis Client Error', err));

redis.connect().catch((err) => {
  console.error('Failed to connect to Redis', err);
});

