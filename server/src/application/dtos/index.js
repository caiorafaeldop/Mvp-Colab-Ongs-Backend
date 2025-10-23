const { z } = require('zod');

/**
 * DTO para criação de usuário
 */
const CreateUserDTO = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  phone: z.string().optional(),
  userType: z.enum(['organization', 'common']).default('common'),
});

/**
 * DTO para login
 */
const LoginDTO = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

/**
 * DTO para verificação de email
 */
const VerifyEmailDTO = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
});

/**
 * DTO para solicitar código de verificação
 */
const RequestVerificationCodeDTO = z.object({
  email: z.string().email('Email inválido'),
});

/**
 * DTO para solicitar recuperação de senha
 */
const RequestPasswordResetDTO = z.object({
  email: z.string().email('Email inválido'),
});

/**
 * DTO para redefinir senha
 */
const ResetPasswordDTO = z.object({
  email: z.string().email('Email inválido'),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

module.exports = {
  CreateUserDTO,
  LoginDTO,
  VerifyEmailDTO,
  RequestVerificationCodeDTO,
  RequestPasswordResetDTO,
  ResetPasswordDTO,
};
