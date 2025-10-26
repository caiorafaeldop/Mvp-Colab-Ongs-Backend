const bcrypt = require('bcrypt');
const { logger } = require('../../infra/logger');

/**
 * Use Case para recuperação de senha
 * Gera códigos de recuperação e permite redefinir senha
 */
class PasswordResetUseCase {
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
   * Solicitar recuperação de senha (enviar código)
   */
  async requestPasswordReset(email) {
    try {
      // Verificar se o usuário existe
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        logger.warn('Tentativa de recuperação de senha para email inexistente', { email });

        return {
          success: true,
          message: 'Se o email existir, você receberá um código de recuperação',
          data: { email },
        };
      }

      // Verificar rate limiting (máximo 3 códigos em 5 minutos)
      const recentAttempts = await this.verificationCodeRepository.countRecentAttempts(
        email,
        'password_reset',
        5
      );

      if (recentAttempts >= 3) {
        throw new Error('Muitas tentativas. Aguarde 5 minutos antes de solicitar um novo código.');
      }

      // Invalidar códigos anteriores
      await this.verificationCodeRepository.invalidatePreviousCodes(email, 'password_reset');

      // Gerar novo código
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Salvar código no banco
      await this.verificationCodeRepository.create({
        email,
        code,
        type: 'password_reset',
        expiresAt,
      });

      // Enviar email
      const emailResult = await this.emailService.sendPasswordResetEmail(email, user.name, code);

      logger.info('Código de recuperação de senha enviado', {
        email,
        previewUrl: emailResult.previewUrl,
      });

      return {
        success: true,
        message: 'Código de recuperação enviado para seu email',
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
      logger.error('Erro ao solicitar recuperação de senha', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Verificar código de recuperação
   */
  async verifyResetCode(email, code) {
    try {
      // Buscar código válido
      const verificationCode = await this.verificationCodeRepository.findValidCode(
        email,
        code,
        'password_reset'
      );

      if (!verificationCode) {
        throw new Error('Código inválido ou expirado');
      }

      logger.info('Código de recuperação verificado', { email });

      return {
        success: true,
        message: 'Código válido',
        data: {
          email,
          codeId: verificationCode.id,
        },
      };
    } catch (error) {
      logger.error('Erro ao verificar código de recuperação', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  /**
   * Redefinir senha usando código válido
   */
  async resetPassword(email, code, newPassword) {
    try {
      // Validar nova senha
      if (!newPassword || newPassword.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }

      // Buscar código válido
      const verificationCode = await this.verificationCodeRepository.findValidCode(
        email,
        code,
        'password_reset'
      );

      if (!verificationCode) {
        throw new Error('Código inválido ou expirado');
      }

      // Buscar usuário
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Hash da nova senha (rounds reduzidos para performance no Render)
      const saltRounds = process.env.NODE_ENV === 'production' ? 8 : 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha do usuário
      await this.userRepository.update(user.id, {
        password: hashedPassword,
      });

      // Marcar código como usado
      await this.verificationCodeRepository.markAsUsed(verificationCode.id);

      logger.info('Senha redefinida com sucesso', { email, userId: user.id });

      return {
        success: true,
        message: 'Senha redefinida com sucesso',
        data: {
          email,
        },
      };
    } catch (error) {
      logger.error('Erro ao redefinir senha', {
        error: error.message,
        email,
      });
      throw error;
    }
  }
}

module.exports = PasswordResetUseCase;
