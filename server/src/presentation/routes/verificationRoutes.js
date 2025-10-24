const express = require('express');

/**
 * Cria rotas de verificação de email e recuperação de senha
 */
const createVerificationRoutes = (verificationController) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/auth/verify-email/send:
   *   post:
   *     tags: [Verification]
   *     summary: Enviar código de verificação de email
   *     description: Envia um código de 6 dígitos para o email do usuário
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "usuario@exemplo.com"
   *     responses:
   *       200:
   *         description: Código enviado com sucesso
   *       400:
   *         description: Email inválido ou usuário não encontrado
   *       429:
   *         description: Muitas tentativas, aguarde alguns minutos
   */
  router.post('/verify-email/send', verificationController.sendVerificationCode);

  /**
   * @swagger
   * /api/auth/verify-email/verify:
   *   post:
   *     tags: [Verification]
   *     summary: Verificar código de email
   *     description: Valida o código de 6 dígitos e marca o email como verificado
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - code
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "usuario@exemplo.com"
   *               code:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: Email verificado com sucesso
   *       400:
   *         description: Código inválido ou expirado
   */
  router.post('/verify-email/verify', verificationController.verifyEmail);

  /**
   * @swagger
   * /api/auth/verify-email/resend:
   *   post:
   *     tags: [Verification]
   *     summary: Reenviar código de verificação
   *     description: Reenvia um novo código de verificação para o email
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "usuario@exemplo.com"
   *     responses:
   *       200:
   *         description: Código reenviado com sucesso
   *       429:
   *         description: Muitas tentativas, aguarde alguns minutos
   */
  router.post('/verify-email/resend', verificationController.resendVerificationCode);

  /**
   * @swagger
   * /api/auth/password-reset/request:
   *   post:
   *     tags: [Password Reset]
   *     summary: Solicitar recuperação de senha
   *     description: Envia um código de 6 dígitos para recuperação de senha
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "usuario@exemplo.com"
   *     responses:
   *       200:
   *         description: Código enviado com sucesso
   *       429:
   *         description: Muitas tentativas, aguarde alguns minutos
   */
  router.post('/password-reset/request', verificationController.requestPasswordReset);

  /**
   * @swagger
   * /api/auth/password-reset/verify:
   *   post:
   *     tags: [Password Reset]
   *     summary: Verificar código de recuperação
   *     description: Valida o código de recuperação de senha
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - code
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "usuario@exemplo.com"
   *               code:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: Código válido
   *       400:
   *         description: Código inválido ou expirado
   */
  router.post('/password-reset/verify', verificationController.verifyResetCode);

  /**
   * @swagger
   * /api/auth/password-reset/reset:
   *   post:
   *     tags: [Password Reset]
   *     summary: Redefinir senha
   *     description: Redefine a senha usando o código de verificação
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - code
   *               - newPassword
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "usuario@exemplo.com"
   *               code:
   *                 type: string
   *                 example: "123456"
   *               newPassword:
   *                 type: string
   *                 format: password
   *                 example: "novaSenha123"
   *     responses:
   *       200:
   *         description: Senha redefinida com sucesso
   *       400:
   *         description: Código inválido ou senha inválida
   */
  router.post('/password-reset/reset', verificationController.resetPassword);

  return router;
};

module.exports = createVerificationRoutes;
