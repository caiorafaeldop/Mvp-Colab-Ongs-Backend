const { z } = require('zod');

/**
 * Schemas de validação para User usando Zod
 * Centraliza todas as validações relacionadas a usuários
 */

// Schema base para campos comuns
const baseUserFields = {
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
    
  email: z.string()
    .email('Email deve ter um formato válido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase(),
    
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999')
    .optional(),
    
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula e 1 número')
};

// Schema para criação de usuário
const createUserSchema = z.object({
  ...baseUserFields,
  phone: baseUserFields.phone, // phone é opcional na criação
  organizationType: z.enum(['ong', 'empresa', 'pessoa_fisica'], {
    errorMap: () => ({ message: 'Tipo de organização deve ser: ong, empresa ou pessoa_fisica' })
  }).optional(),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  address: z.object({
    street: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 12345-678').optional(),
    country: z.string().max(100).default('Brasil')
  }).optional()
});

// Schema para login
const loginSchema = z.object({
  email: baseUserFields.email,
  password: z.string().min(1, 'Senha é obrigatória')
});

// Schema para atualização de usuário
const updateUserSchema = z.object({
  name: baseUserFields.name.optional(),
  phone: baseUserFields.phone,
  description: z.string().max(500).optional(),
  address: z.object({
    street: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().length(2).optional(),
    zipCode: z.string().regex(/^\d{5}-?\d{3}$/).optional(),
    country: z.string().max(100).optional()
  }).optional()
});

// Schema para mudança de senha
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: baseUserFields.password,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Nova senha e confirmação devem ser iguais',
  path: ['confirmPassword']
});

// Schema para reset de senha
const resetPasswordSchema = z.object({
  email: baseUserFields.email
});

// Schema para confirmar reset de senha
const confirmResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: baseUserFields.password,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Nova senha e confirmação devem ser iguais',
  path: ['confirmPassword']
});

module.exports = {
  createUserSchema,
  loginSchema,
  updateUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
  confirmResetPasswordSchema
};
