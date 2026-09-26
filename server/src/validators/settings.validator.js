const { z } = require('zod');
exports.updateSettingsSchema = z.object({
  name: z.string().optional(),
  currency: z.string().optional(),
  defaultEmergencyBuffer: z.number().nonnegative().optional()
});
exports.createAccountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['BANK', 'CASH', 'UPI', 'WALLET', 'OTHER']),
  initialBalance: z.number(),
  notes: z.string().optional()
});
exports.updateAccountSchema = exports.createAccountSchema.partial();
