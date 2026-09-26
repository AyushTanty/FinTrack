const { z } = require('zod');

const dateSchema = z.union([
  z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date string' }),
  z.date()
]);

exports.createGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.coerce.number().positive(),
  targetDate: dateSchema.optional().nullable(),
  monthlyContribution: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional().nullable()
});

exports.updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  targetAmount: z.coerce.number().positive().optional(),
  currentAmount: z.coerce.number().nonnegative().optional(),
  targetDate: dateSchema.optional().nullable(),
  monthlyContribution: z.coerce.number().nonnegative().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable()
});

exports.addContributionSchema = z.object({
  amount: z.coerce.number().positive(),
  date: dateSchema,
  notes: z.string().optional().nullable()
});
