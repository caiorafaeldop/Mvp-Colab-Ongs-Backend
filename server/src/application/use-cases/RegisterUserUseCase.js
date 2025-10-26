const bcrypt = require('bcrypt');
const User = require('../../domain/entities/User');

/**
 * Use Case para registro de usuário
 */
class RegisterUserUseCase {
  constructor(userRepository, logger, verifyEmailUseCase = null) {
    this.userRepository = userRepository;
    this.logger = logger;
    this.verifyEmailUseCase = verifyEmailUseCase;
  }

  async execute(createUserDTO) {
    try {
      // Verificar se o email já existe
      const existingUser = await this.userRepository.findByEmail(createUserDTO.email);
      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      // IMPORTANTE: Forçar userType como 'common' (outros tipos são criados manualmente)
      const userType = 'common';

      // Hash da senha
      const hashedPassword = await bcrypt.hash(createUserDTO.password, 10);

      // NÃO salvar usuário ainda - apenas armazenar dados temporariamente
      // Vamos salvar os dados no metadata do código de verificação
      const pendingUserData = {
        name: createUserDTO.name,
        email: createUserDTO.email,
        password: hashedPassword,
        userType: userType,
        phone: createUserDTO.phone,
      };

      this.logger.info('Iniciando registro de usuário (aguardando verificação)', {
        email: createUserDTO.email,
        userType: userType,
      });

      // Enviar email de verificação com dados do usuário pendente
      let emailResult = null;
      if (this.verifyEmailUseCase) {
        try {
          emailResult = await this.verifyEmailUseCase.sendVerificationCodeForRegistration(
            createUserDTO.email,
            createUserDTO.name,
            pendingUserData
          );
          this.logger.info('Email de verificação enviado', {
            email: createUserDTO.email,
            previewUrl: emailResult.data?.previewUrl,
          });
        } catch (emailError) {
          this.logger.error('Erro ao enviar email de verificação', {
            error: emailError.message,
            email: createUserDTO.email,
          });
          throw new Error('Erro ao enviar email de verificação. Tente novamente.');
        }
      } else {
        throw new Error('Serviço de verificação de email não disponível');
      }

      return {
        success: true,
        message: 'Código de verificação enviado para seu email. Verifique sua caixa de entrada.',
        data: {
          email: createUserDTO.email,
          requiresVerification: true,
          // Incluir preview URL em desenvolvimento
          ...(emailResult?.data?.previewUrl && {
            emailPreviewUrl: emailResult.data.previewUrl,
          }),
        },
      };
    } catch (error) {
      this.logger.error('Erro ao registrar usuário', {
        error: error.message,
        email: createUserDTO.email,
      });
      throw error;
    }
  }
}

module.exports = RegisterUserUseCase;
