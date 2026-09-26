const { z } = require('zod');
exports.registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  initialBalance: z.number().default(0)
});
exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
