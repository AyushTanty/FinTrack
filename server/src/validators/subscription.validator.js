const { z } = require('zod');

const dateSchema = z.union([
  z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date string' }),
  z.date()
]);

exports.createSubscriptionSchema = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().min(1),
  type: z.enum(['OTT', 'GYM', 'INTERNET', 'MOBILE', 'SOFTWARE', 'COURSE', 'FOOD', 'OTHER']),
  amount: z.coerce.number().positive(),
  billingCycle: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: dateSchema,
  nextBillingDate: dateSchema,
  isActive: z.boolean().optional(),
  isFlexible: z.boolean().default(false),
  skipRule: z.enum(['NO_ADJUSTMENT', 'REFUND_PER_DAY', 'CREDIT_PER_DAY', 'CARRY_FORWARD', 'MANUAL_ADJUSTMENT']).optional().nullable(),
  notes: z.string().optional().nullable()
});

exports.updateSubscriptionSchema = exports.createSubscriptionSchema.partial();

exports.usageSchema = z.object({
  date: dateSchema,
  status: z.enum(['USED', 'SKIPPED', 'HOLIDAY', 'UNAVAILABLE', 'CUSTOM']),
  notes: z.string().optional().nullable()
});

exports.updateUsageSchema = z.object({
  status: z.enum(['USED', 'SKIPPED', 'HOLIDAY', 'UNAVAILABLE', 'CUSTOM']),
  notes: z.string().optional().nullable()
});
