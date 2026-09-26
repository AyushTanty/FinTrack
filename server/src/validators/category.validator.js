const { z } = require('zod');
exports.createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['FIXED', 'VARIABLE', 'DISCRETIONARY', 'SAVINGS', 'INCOME']),
  icon: z.string().optional(),
  color: z.string().optional()
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
