const rateLimit = require('express-rate-limit');

// General rate limiter for normal API routes
// Generous for development and normal personal usage (5,000 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5000,
  skip: (req) => {
    // Exempt health check and allow smooth local dev navigation
    return req.path === '/health' || req.ip === '127.0.0.1' || req.ip === '::1';
  },
  message: { success: false, error: 'Too many requests. Please try again later.' }
});

// Dedicated AI rate limiter — protects third-party AI provider from runaway loops
const aiPerMinuteLimit = parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '60', 10);
const aiPerHourLimit = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '500', 10);

const aiLimiterPerMinute = rateLimit({
  windowMs: 60 * 1000,
  limit: aiPerMinuteLimit,
  message: { success: false, error: 'AI request limit reached. Please try again in a minute.' }
});

const aiLimiterPerHour = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: aiPerHourLimit,
  message: { success: false, error: 'AI hourly request limit reached. Please try again later.' }
});

module.exports = generalLimiter;
module.exports.aiLimiterPerMinute = aiLimiterPerMinute;
module.exports.aiLimiterPerHour = aiLimiterPerHour;
