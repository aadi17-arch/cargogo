import { redis } from '@/config/redis';
import jwt from 'jsonwebtoken';

const KEY_PREFIX = 'blacklist:token:';

export const addToBlacklist = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    let ttlSeconds = 15 * 60; 

    if (decoded && decoded.exp) {
      const remainingSeconds = Math.floor(decoded.exp - Date.now() / 1000);
      if (remainingSeconds <= 0) {
        return; 
      }
      ttlSeconds = remainingSeconds;
    }

    await redis.set(`${KEY_PREFIX}${token}`, 'revoked', 'EX', ttlSeconds);
  } catch (error) {
    console.error('Failed to add token to Redis blacklist:', error);
  }
};

export const isBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const exists = await redis.get(`${KEY_PREFIX}${token}`);
    return Boolean(exists);
  } catch (error) {
    console.error('Failed to check token Redis blacklist:', error);
    return false;
  }
};
