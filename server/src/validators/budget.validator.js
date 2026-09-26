const { z } = require('zod');
exports.createBudgetSchema = z.object({
  categoryId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  amount: z.number().nonnegative()
});
exports.updateBudgetSchema = z.object({ amount: z.number().nonnegative() });
