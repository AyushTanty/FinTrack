const { z } = require('zod');

const dateSchema = z.union([
  z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date string' }),
  z.date()
]);

exports.createExpenseSchema = z.object({
  accountId: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: dateSchema,
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER']),
  notes: z.string().optional().nullable()
});

exports.updateExpenseSchema = exports.createExpenseSchema.partial();
