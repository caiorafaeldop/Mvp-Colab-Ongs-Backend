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
      // Tentar buscar código de registro primeiro
      let verificationCode = await this.verificationCodeRepository.findValidCode(
        email,
        code,
        'registration'
      );

      let isRegistration = false;
      if (verificationCode) {
        isRegistration = true;
      } else {
        // Se não for registro, buscar código de email_verification
        verificationCode = await this.verificationCodeRepository.findValidCode(
          email,
          code,
          'email_verification'
        );
      }

      if (!verificationCode) {
        throw new Error('Código inválido ou expirado');
      }

      // Marcar código como usado
      await this.verificationCodeRepository.markAsUsed(verificationCode.id);

      let user;

      if (isRegistration) {
        // CRIAR USUÁRIO AGORA (dados estão no metadata)
        const pendingUserData = verificationCode.metadata;
        if (!pendingUserData || !pendingUserData.email) {
          throw new Error('Dados do usuário pendente não encontrados');
        }

        const User = require('../../domain/entities/User');
        const newUser = new User(
          null,
          pendingUserData.name,
          pendingUserData.email,
          pendingUserData.password, // Já está hasheado
          pendingUserData.userType || 'common',
          pendingUserData.phone
        );

        user = await this.userRepository.save(newUser);

        // Marcar email como verificado
        await this.userRepository.update(user.id, {
          emailVerified: true,
        });

        logger.info('Usuário criado e verificado com sucesso', { email, userId: user.id });
      } else {
        // Atualizar usuário existente como verificado
        user = await this.userRepository.findByEmail(email);
        if (!user) {
          throw new Error('Usuário não encontrado');
        }

        // Atualizar campo emailVerified
        await this.userRepository.update(user.id, {
          emailVerified: true,
        });

        logger.info('Email verificado com sucesso', { email, userId: user.id });
      }

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

      return {
        success: true,
        message: isRegistration
          ? 'Conta criada e verificada com sucesso'
          : 'Email verificado com sucesso',
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

  /**
   * Enviar código de verificação para registro (antes de criar conta)
   */
  async sendVerificationCodeForRegistration(email, name, pendingUserData) {
    try {
      // Verificar rate limiting (máximo 3 códigos em 5 minutos)
      const recentAttempts = await this.verificationCodeRepository.countRecentAttempts(
        email,
        'registration',
        5
      );

      if (recentAttempts >= 3) {
        throw new Error('Muitas tentativas. Aguarde 5 minutos antes de solicitar um novo código.');
      }

      // Invalidar códigos anteriores
      await this.verificationCodeRepository.invalidatePreviousCodes(email, 'registration');

      // Gerar novo código
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Salvar código no banco com dados do usuário pendente
      await this.verificationCodeRepository.create({
        email,
        code,
        type: 'registration',
        expiresAt,
        metadata: pendingUserData,
      });

      // Enviar email DE FORMA ASSÍNCRONA (não esperar)
      logger.info('[VERIFY EMAIL] Agendando envio de email...', { email, code });
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🚀 INICIANDO ENVIO DE EMAIL ASSÍNCRONO`);
      console.log(`Email: ${email}`);
      console.log(`Código: ${code}`);
      console.log(`${'='.repeat(80)}\n`);

      // Enviar email em background (fire and forget)
      this.emailService
        .sendVerificationEmail(email, name, code)
        .then((emailResult) => {
          console.log(`\n${'='.repeat(80)}`);
          console.log(`✅ EMAIL ENVIADO COM SUCESSO!`);
          console.log(`Email: ${email}`);
          console.log(`MessageId: ${emailResult.messageId}`);
          console.log(`Preview URL: ${emailResult.previewUrl || 'N/A'}`);
          console.log(`${'='.repeat(80)}\n`);

          logger.info('[VERIFY EMAIL] Email enviado com sucesso!', {
            email,
            messageId: emailResult.messageId,
            previewUrl: emailResult.previewUrl,
          });
        })
        .catch((error) => {
          console.log(`\n${'='.repeat(80)}`);
          console.log(`❌ ERRO AO ENVIAR EMAIL!`);
          console.log(`Email: ${email}`);
          console.log(`Erro: ${error.message}`);
          console.log(`Stack: ${error.stack}`);
          console.log(`${'='.repeat(80)}\n`);

          logger.error('[VERIFY EMAIL] Erro ao enviar email (background):', {
            email,
            error: error.message,
            stack: error.stack,
          });
        });

      logger.info('Código de verificação de registro criado (email sendo enviado em background)', {
        email,
      });

      return {
        success: true,
        message: 'Código de verificação enviado para seu email',
        data: {
          email,
          expiresIn: '15 minutos',
        },
      };
    } catch (error) {
      logger.error('Erro ao enviar código de verificação de registro', {
        error: error.message,
        email,
      });
      throw error;
    }
  }
}

module.exports = VerifyEmailUseCase;
