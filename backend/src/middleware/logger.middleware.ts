import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '@/utils/logger';
import { Interface } from 'readline';

declare global{
  namespace Express{
    interface Request {
      requestId?: string;
    }
  }
}
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  req.requestId = requestId;

  const startTime = Date.now();

  logger.info(`'incoming Request': ${req.method} ${req.originalUrl}`, { requestId });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const message = `Completed Request: ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`;
    if (res.statusCode >= 500) logger.error(message, { requestId });
    else if (res.statusCode >= 400) logger.warn(message, { requestId });
    else logger.info(message, { requestId });
  });
  next();
}
