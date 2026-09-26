const { z } = require('zod');

const dateSchema = z.union([
  z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date string' }),
  z.date()
]);

exports.createIncomeSchema = z.object({
  accountId: z.string().optional().nullable(),
  source: z.string().min(1),
  type: z.enum(['SALARY', 'FREELANCE', 'ONE_TIME', 'OTHER']),
  amount: z.coerce.number().positive(),
  date: dateSchema,
  isRecurring: z.boolean().default(false),
  notes: z.string().optional().nullable()
});

exports.updateIncomeSchema = exports.createIncomeSchema.partial();
