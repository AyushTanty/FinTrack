const { z } = require('zod');
exports.createMonthlyPlanSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  plannedIncome: z.number().nonnegative(),
  savingsAllocation: z.number().nonnegative().optional(),
  emergencyBuffer: z.number().nonnegative().optional(),
  notes: z.string().optional()
});
exports.updateMonthlyPlanSchema = exports.createMonthlyPlanSchema.partial();
exports.rolloverSchema = z.object({
  allocations: z.array(z.object({
    destination: z.enum(['next_month', 'savings', 'emergency_buffer']),
    goalId: z.string().optional(),
    amount: z.number().positive()
  }))
});
