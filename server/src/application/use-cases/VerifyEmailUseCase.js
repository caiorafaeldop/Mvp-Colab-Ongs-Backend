const { logger } = require('../../infra/logger');
const jwt = require('jsonwebtoken');

/**
 * Use Case para verificação de email
 * Gera e valida códigos de verificação de 6 dígitos
 */
class VerifyEmailUseCase {
  constructor(userRepository, verificationCodeRepository, emailService) {
    this.userRepository = userRepository;
    this.verificationCodeRepository = verificationCodeRepository;
    this.emailService = emailService;
  }

  /**
   * Gerar código de 6 dígitos aleatório
   */
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Enviar código de verificação para email
   */
  async sendVerificationCode(email) {
    try {
      // Verificar se o usuário existe
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se o email já está verificado
      if (user.emailVerified) {
        throw new Error('Email já verificado');
      }

      // Verificar rate limiting (máximo 3 códigos em 5 minutos)
      const recentAttempts = await this.verificationCodeRepository.countRecentAttempts(
        email,
        'email_verification',
        5
      );

      if (recentAttempts >= 3) {
        throw new Error('Muitas tentativas. Aguarde 5 minutos antes de solicitar um novo código.');
      }

      // Invalidar códigos anteriores
      await this.verificationCodeRepository.invalidatePreviousCodes(email, 'email_verification');

      // Gerar novo código
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Salvar código no banco
      await this.verificationCodeRepository.create({
        email,
        code,
        type: 'email_verification',
        expiresAt,
      });

      // Enviar email
      const emailResult = await this.emailService.sendVerificationEmail(email, user.name, code);

      logger.info('Código de verificação enviado', {
        email,
        previewUrl: emailResult.previewUrl,
      });

      return {
        success: true,
        message: 'Código de verificação enviado para seu email',
        data: {
          email,
          expiresIn: '15 minutos',
          // Em desenvolvimento, retornar preview URL
          ...(process.env.NODE_ENV !== 'production' && {
            previewUrl: emailResult.previewUrl,
          }),
        },
      };
    } catch (error) {
      logger.error('Erro ao enviar código de verificação', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Verificar código de verificação
   */
  async verifyCode(email, code) {
    try {
      // Buscar código válido
      const verificationCode = await this.verificationCodeRepository.findValidCode(
        email,
        code,
        'email_verification'
      );

      if (!verificationCode) {
        throw new Error('Código inválido ou expirado');
      }

      // Marcar código como usado
      await this.verificationCodeRepository.markAsUsed(verificationCode.id);

      // Atualizar usuário como verificado
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Atualizar campo emailVerified
      await this.userRepository.update(user.id, {
        emailVerified: true,
      });

      // Gerar token JWT para login automático
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          userType: user.userType,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      logger.info('Email verificado com sucesso', { email, userId: user.id });

      return {
        success: true,
        message: 'Email verificado com sucesso',
        data: {
          email,
          verified: true,
          token, // Token para login automático
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            userType: user.userType,
          },
        },
      };
    } catch (error) {
      logger.error('Erro ao verificar código', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Reenviar código de verificação
   */
  async resendVerificationCode(email) {
    return this.sendVerificationCode(email);
  }
}

module.exports = VerifyEmailUseCase;
