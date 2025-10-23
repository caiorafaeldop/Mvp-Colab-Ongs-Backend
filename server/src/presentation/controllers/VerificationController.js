const { logger } = require('../../infra/logger');

/**
 * Controller para verificação de email e recuperação de senha
 */
class VerificationController {
  constructor(verifyEmailUseCase, passwordResetUseCase) {
    this.verifyEmailUseCase = verifyEmailUseCase;
    this.passwordResetUseCase = passwordResetUseCase;

    // Bind dos métodos
    this.sendVerificationCode = this.sendVerificationCode.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.resendVerificationCode = this.resendVerificationCode.bind(this);
    this.requestPasswordReset = this.requestPasswordReset.bind(this);
    this.verifyResetCode = this.verifyResetCode.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  /**
   * Enviar código de verificação de email
   * POST /api/auth/verify-email/send
   */
  async sendVerificationCode(req, res) {
    const requestLogger = req.logger || logger;

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório',
          error: 'MISSING_EMAIL',
        });
      }

      requestLogger.info('Enviando código de verificação', {
        controller: 'VerificationController',
        action: 'sendVerificationCode',
        email,
      });

      const result = await this.verifyEmailUseCase.sendVerificationCode(email);

      res.status(200).json(result);
    } catch (error) {
      requestLogger.error('Erro ao enviar código de verificação', {
        controller: 'VerificationController',
        action: 'sendVerificationCode',
        error: error.message,
      });

      const statusCode = error.message.includes('Muitas tentativas') ? 429 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: 'VERIFICATION_CODE_ERROR',
      });
    }
  }

  /**
   * Verificar código de email
   * POST /api/auth/verify-email/verify
   */
  async verifyEmail(req, res) {
    const requestLogger = req.logger || logger;

    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: 'Email e código são obrigatórios',
          error: 'MISSING_FIELDS',
        });
      }

      requestLogger.info('Verificando código de email', {
        controller: 'VerificationController',
        action: 'verifyEmail',
        email,
      });

      const result = await this.verifyEmailUseCase.verifyCode(email, code);

      res.status(200).json(result);
    } catch (error) {
      requestLogger.error('Erro ao verificar código', {
        controller: 'VerificationController',
        action: 'verifyEmail',
        error: error.message,
      });

      res.status(400).json({
        success: false,
        message: error.message,
        error: 'VERIFICATION_ERROR',
      });
    }
  }

  /**
   * Reenviar código de verificação
   * POST /api/auth/verify-email/resend
   */
  async resendVerificationCode(req, res) {
    const requestLogger = req.logger || logger;

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório',
          error: 'MISSING_EMAIL',
        });
      }

      requestLogger.info('Reenviando código de verificação', {
        controller: 'VerificationController',
        action: 'resendVerificationCode',
        email,
      });

      const result = await this.verifyEmailUseCase.resendVerificationCode(email);

      res.status(200).json(result);
    } catch (error) {
      requestLogger.error('Erro ao reenviar código', {
        controller: 'VerificationController',
        action: 'resendVerificationCode',
        error: error.message,
      });

      const statusCode = error.message.includes('Muitas tentativas') ? 429 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: 'RESEND_CODE_ERROR',
      });
    }
  }

  /**
   * Solicitar recuperação de senha
   * POST /api/auth/password-reset/request
   */
  async requestPasswordReset(req, res) {
    const requestLogger = req.logger || logger;

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório',
          error: 'MISSING_EMAIL',
        });
      }

      requestLogger.info('Solicitando recuperação de senha', {
        controller: 'VerificationController',
        action: 'requestPasswordReset',
        email,
      });

      const result = await this.passwordResetUseCase.requestPasswordReset(email);

      res.status(200).json(result);
    } catch (error) {
      requestLogger.error('Erro ao solicitar recuperação de senha', {
        controller: 'VerificationController',
        action: 'requestPasswordReset',
        error: error.message,
      });

      const statusCode = error.message.includes('Muitas tentativas') ? 429 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: 'PASSWORD_RESET_REQUEST_ERROR',
      });
    }
  }

  /**
   * Verificar código de recuperação de senha
   * POST /api/auth/password-reset/verify
   */
  async verifyResetCode(req, res) {
    const requestLogger = req.logger || logger;

    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: 'Email e código são obrigatórios',
          error: 'MISSING_FIELDS',
        });
      }

      requestLogger.info('Verificando código de recuperação', {
        controller: 'VerificationController',
        action: 'verifyResetCode',
        email,
      });

      const result = await this.passwordResetUseCase.verifyResetCode(email, code);

      res.status(200).json(result);
    } catch (error) {
      requestLogger.error('Erro ao verificar código de recuperação', {
        controller: 'VerificationController',
        action: 'verifyResetCode',
        error: error.message,
      });

      res.status(400).json({
        success: false,
        message: error.message,
        error: 'RESET_CODE_VERIFICATION_ERROR',
      });
    }
  }

  /**
   * Redefinir senha
   * POST /api/auth/password-reset/reset
   */
  async resetPassword(req, res) {
    const requestLogger = req.logger || logger;

    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email, código e nova senha são obrigatórios',
          error: 'MISSING_FIELDS',
        });
      }

      requestLogger.info('Redefinindo senha', {
        controller: 'VerificationController',
        action: 'resetPassword',
        email,
      });

      const result = await this.passwordResetUseCase.resetPassword(email, code, newPassword);

      res.status(200).json(result);
    } catch (error) {
      requestLogger.error('Erro ao redefinir senha', {
        controller: 'VerificationController',
        action: 'resetPassword',
        error: error.message,
      });

      res.status(400).json({
        success: false,
        message: error.message,
        error: 'PASSWORD_RESET_ERROR',
      });
    }
  }
}

module.exports = VerificationController;
