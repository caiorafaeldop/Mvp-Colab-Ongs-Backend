const { z } = require('zod');

/**
 * Schemas de validação para Donations usando Zod
 * Centraliza todas as validações relacionadas a doações
 */

// Schema para criação de doação
const createDonationSchema = z.object({
  amount: z.number()
    .positive('Valor deve ser positivo')
    .min(1, 'Valor mínimo é R$ 1,00')
    .max(100000, 'Valor máximo é R$ 100.000,00')
    .multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais'),
    
  currency: z.string()
    .length(3, 'Moeda deve ter 3 caracteres')
    .default('BRL'),
    
  donorId: z.string()
    .min(1, 'ID do doador é obrigatório'),
    
  recipientId: z.string()
    .min(1, 'ID do beneficiário é obrigatório'),
    
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
    
  isAnonymous: z.boolean()
    .default(false),
    
  paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'boleto'], {
    errorMap: () => ({ message: 'Método de pagamento deve ser: credit_card, debit_card, pix ou boleto' })
  }).default('pix'),
  
  metadata: z.object({
    campaign: z.string().optional(),
    source: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional()
  }).optional()
});

// Schema para processamento de pagamento
const processPaymentSchema = z.object({
  donationId: z.string().min(1, 'ID da doação é obrigatório'),
  
  paymentData: z.object({
    // Dados do cartão (se aplicável)
    cardToken: z.string().optional(),
    cardholderName: z.string().max(100).optional(),
    
    // Dados do pagador
    payer: z.object({
      email: z.string().email('Email deve ser válido'),
      firstName: z.string().max(50, 'Nome deve ter no máximo 50 caracteres'),
      lastName: z.string().max(50, 'Sobrenome deve ter no máximo 50 caracteres'),
      identification: z.object({
        type: z.enum(['CPF', 'CNPJ']),
        number: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos')
      }).optional()
    }),
    
    // Dados de cobrança
    billingAddress: z.object({
      zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 12345-678'),
      street: z.string().max(255),
      number: z.string().max(10),
      neighborhood: z.string().max(100),
      city: z.string().max(100),
      state: z.string().length(2, 'Estado deve ter 2 caracteres')
    }).optional()
  })
});

// Schema para atualização de doação
const updateDonationSchema = z.object({
  description: z.string().max(500).optional(),
  metadata: z.object({
    campaign: z.string().optional(),
    source: z.string().optional(),
    notes: z.string().max(1000).optional()
  }).optional()
});

// Schema para busca/filtros de doações
const donationFiltersSchema = z.object({
  donorId: z.string().optional(),
  recipientId: z.string().optional(),
  status: z.enum(['pending', 'processing', 'approved', 'rejected', 'cancelled']).optional(),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'boleto']).optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isAnonymous: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
}).refine((data) => {
  if (data.minAmount && data.maxAmount) {
    return data.minAmount <= data.maxAmount;
  }
  return true;
}, {
  message: 'Valor mínimo deve ser menor ou igual ao valor máximo',
  path: ['minAmount']
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Data inicial deve ser anterior à data final',
  path: ['startDate']
});

// Schema para webhook do Mercado Pago
const mercadoPagoWebhookSchema = z.object({
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(),
  date_created: z.string(),
  application_id: z.number(),
  user_id: z.number(),
  version: z.number(),
  api_version: z.string(),
  action: z.string(),
  data: z.object({
    id: z.string()
  })
});

module.exports = {
  createDonationSchema,
  processPaymentSchema,
  updateDonationSchema,
  donationFiltersSchema,
  mercadoPagoWebhookSchema
};
