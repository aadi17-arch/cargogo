import { Request, Response, NextFunction } from 'express';
import { redis } from '@/config/redis';

export const idempotency = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['idempotency-key'] as string;
  if (!key) {
    return next();
  }
  const redisKey = `idempotency:${key}`;

  try {
    const cachedRecord = await redis.get(redisKey);
    if (cachedRecord) {
      const record = JSON.parse(cachedRecord);

      if (record.status === 'STARTED') {
        return res.status(409).json({ success: false, message: 'Duplicate request is already being processed.' });
      }
      if (record.status === 'SUCCESS') {
        return res.status(record.statusCode).json(record.body);
      }
    }

    await redis.set(redisKey, JSON.stringify({ status: 'STARTED' }), { EX: 600 });
    const originalJson = res.json;
    res.json = function (body: any): Response {
      res.json = originalJson;
        redis.set(
          redisKey,
          JSON.stringify({
            status: 'SUCCESS',
            statusCode: res.statusCode,
            body: body,
          }),
          { EX: 600 }
        ).catch((e) => console.error('Failed to save idempotency cache:', e));

      return originalJson.call(this, body);

    };
    next();
  } catch (e: any) {
    console.error('Idempotency middleware error:', e);
    next();
  }
}
