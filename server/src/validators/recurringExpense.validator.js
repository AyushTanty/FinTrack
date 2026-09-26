const { z } = require('zod');

const dateSchema = z.union([
  z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date string' }),
  z.date()
]);

exports.createRecurringSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  amount: z.coerce.number().positive(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  dayOfMonth: z.coerce.number().min(1).max(31),
  monthOfYear: z.coerce.number().min(1).max(12).optional().nullable(),
  startDate: dateSchema,
  endDate: dateSchema.optional().nullable(),
  notes: z.string().optional().nullable()
});

exports.updateRecurringSchema = exports.createRecurringSchema.partial();
