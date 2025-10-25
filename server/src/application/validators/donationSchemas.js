const { z } = require('zod');

// Schema base para doações
const baseDonationSchema = {
  organizationId: z.string().min(1),
  organizationName: z.string().min(1),
  amount: z.preprocess((v) => (typeof v === 'string' ? parseFloat(v) : v), z.number().positive()),
  donorName: z.string().min(1),
  // Validação relaxada: aceita qualquer string no donorEmail (não valida formato de email)
  // Isso permite que admins com usernames não-email façam doações
  donorEmail: z.string().min(1),
  donorPhone: z.string().optional(),
  donorDocument: z.string().optional(),
  donorAddress: z.string().optional(),
  donorCity: z.string().optional(),
  donorState: z.string().optional(),
  donorZipCode: z.string().optional(),
  message: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  showInPublicList: z.boolean().optional(),
};

const singleDonationSchema = z.object(baseDonationSchema);

const recurringDonationSchema = singleDonationSchema.extend({
  frequency: z.enum(['monthly', 'weekly', 'yearly']).optional(),
});

module.exports = {
  singleDonationSchema,
  recurringDonationSchema,
};
