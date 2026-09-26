const { z } = require('zod');

const dateSchema = z.union([
  z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date string' }),
  z.date()
]);

exports.createPurchaseSchema = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().min(1),
  expectedAmount: z.coerce.number().positive(),
  expectedDate: dateSchema.optional().nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  isRecurring: z.boolean().default(false),
  recurrence: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional().nullable(),
  notes: z.string().optional().nullable()
});

exports.updatePurchaseSchema = exports.createPurchaseSchema.partial();

exports.convertPurchaseSchema = z.object({
  accountId: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER']).optional(),
  date: dateSchema.optional(),
  notes: z.string().optional().nullable()
});
