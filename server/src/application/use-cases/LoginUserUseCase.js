const bcrypt = require('bcrypt');

/**
 * Use Case para login de usuário
 */
class LoginUserUseCase {
  constructor(userRepository, authService, logger) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.logger = logger;
  }

  async execute(loginDTO, requestInfo = {}) {
    try {
      // Buscar usuário por email
      const user = await this.userRepository.findByEmail(loginDTO.email);
      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(loginDTO.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      // Gerar tokens
      const tokens = await this.authService.generateTokens(user);

      this.logger.info('Login realizado com sucesso', {
        userId: user.id,
        email: user.email,
        ip: requestInfo.ip,
      });

      // Remover senha da resposta
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: userWithoutPassword,
          tokens,
          accessToken: tokens.accessToken, // Compatibilidade com frontend
        },
      };
    } catch (error) {
      this.logger.error('Erro ao fazer login', {
        error: error.message,
        email: loginDTO.email,
      });
      throw error;
    }
  }

  async executeLogout(refreshToken, requestInfo = {}) {
    try {
      // Invalidar refresh token se necessário
      // Implementar lógica de blacklist se necessário

      this.logger.info('Logout realizado', {
        ip: requestInfo.ip,
      });

      return {
        success: true,
        message: 'Logout realizado com sucesso',
      };
    } catch (error) {
      this.logger.error('Erro ao fazer logout', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = LoginUserUseCase;
