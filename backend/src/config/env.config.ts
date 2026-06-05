import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from '@/utils/logger';
dotenv.config();

const envScheme = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string({ required_error: 'DATABSE_URL is required' }).url('DATABASE_URL must be a valid connection URL'),
  JWT_SECRET: z.string({ required_error: 'JWT_SECRET is required' }).min(8, 'JWT_SECRET must be at least 8 characters long'),
  JWT_REFRESH_SECRET: z.string().optional(),
});
const envParse = envScheme.safeParse(process.env);

if (!envParse.success) {
  logger.error('Invalid env configuration');
  console.error(envParse.error.format());
    process.exit(1);
}
export const env = envParse.data;
