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

      // Hash da senha
      const hashedPassword = await bcrypt.hash(createUserDTO.password, 10);

      // Criar entidade de usuário
      const user = new User(
        null, // ID será gerado pelo banco
        createUserDTO.name,
        createUserDTO.email,
        hashedPassword,
        createUserDTO.userType || 'common',
        createUserDTO.phone
      );

      // Salvar usuário
      const savedUser = await this.userRepository.save(user);

      this.logger.info('Usuário registrado com sucesso', {
        userId: savedUser.id,
        email: savedUser.email,
        userType: savedUser.userType,
      });

      // Enviar email de verificação automaticamente
      let emailResult = null;
      if (this.verifyEmailUseCase) {
        try {
          emailResult = await this.verifyEmailUseCase.sendVerificationCode(savedUser.email);
          this.logger.info('Email de verificação enviado automaticamente', {
            email: savedUser.email,
            previewUrl: emailResult.data?.previewUrl,
          });
        } catch (emailError) {
          this.logger.error('Erro ao enviar email de verificação', {
            error: emailError.message,
            email: savedUser.email,
          });
          // Não falhar o registro se o email não for enviado
        }
      }

      // Remover senha da resposta
      const { password, ...userWithoutPassword } = savedUser;

      return {
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: userWithoutPassword,
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
