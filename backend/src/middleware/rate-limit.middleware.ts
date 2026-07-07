import rateLimit from "express-rate-limit";

const shouldSkip = () => true;

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:'Too many sensitive requests from this IP, please try again later.',
  },
});

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts max
  skip: shouldSkip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP verification attempts from this IP. Please try again after 5 minutes.'
  }
});
