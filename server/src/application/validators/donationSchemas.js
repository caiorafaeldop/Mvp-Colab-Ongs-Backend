const { z } = require('zod');

const singleDonationSchema = z.object({
  organizationId: z.string().min(1),
  organizationName: z.string().min(1),
  amount: z.preprocess((v) => (typeof v === 'string' ? parseFloat(v) : v), z.number().positive()),
  donorName: z.string().min(1),
  donorEmail: z.string().email(),
  donorPhone: z.string().optional(),
  donorDocument: z.string().optional(),
  donorAddress: z.string().optional(),
  donorCity: z.string().optional(),
  donorState: z.string().optional(),
  donorZipCode: z.string().optional(),
  message: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  showInPublicList: z.boolean().optional()
});

const recurringDonationSchema = singleDonationSchema.extend({
  frequency: z.enum(['monthly', 'weekly', 'yearly']).optional()
});

module.exports = {
  singleDonationSchema,
  recurringDonationSchema
};
