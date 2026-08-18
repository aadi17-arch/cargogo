import rateLimit from "express-rate-limit";

const shouldSkip = () => process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 2000,
  skip: ()=> isDev && process.env.ENABLE_DEV_RATE_LIMIT !== 'true',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 50,
  skip:() => isDev && process.env.ENABLE_DEV_RATE_LIMIT !=='true',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:'Too many sensitive requests from this IP, please try again later.',
  },
});

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isDev ? 100 : 10,
  skip: () => isDev && process.env.ENABLE_DEV_RATE_LIMIT !== 'true',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP verification attempts from this IP. Please try again after 5 minutes.'
  }
});
