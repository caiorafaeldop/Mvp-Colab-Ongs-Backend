const bcrypt = require('bcrypt');

/**
 * Use Case para login de usuário
 * Responsabilidade única: autenticar usuário no sistema
 */
class LoginUserUseCase {
  constructor(userRepository, authService, logger) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.logger = logger;
  }

  /**
   * Executa o caso de uso de login
   * @param {LoginDTO} loginDTO - DTO com dados validados
   * @param {Object} requestInfo - Informações do request (IP, User-Agent)
   * @returns {Promise<Object>} Resultado do login
   */
  async execute(loginDTO, requestInfo = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Iniciando processo de login', {
        useCase: 'LoginUserUseCase',
        loginData: loginDTO.toLogObject(),
        requestInfo: {
          ip: requestInfo.ip,
          userAgent: requestInfo.userAgent
        }
      });

      // 1. Buscar usuário por email
      const user = await this.userRepository.findByEmail(loginDTO.getEmail());
      
      if (!user) {
        this.logger.warn('Tentativa de login com email não encontrado', {
          email: loginDTO.getEmail(),
          ip: requestInfo.ip,
          useCase: 'LoginUserUseCase'
        });
        
        throw new Error('Credenciais inválidas');
      }

      // 2. Verificar se usuário está ativo
      if (!user.isActive) {
        this.logger.warn('Tentativa de login com usuário inativo', {
          userId: user.id || user._id,
          email: user.email,
          ip: requestInfo.ip,
          useCase: 'LoginUserUseCase'
        });
        
        throw new Error('Conta desativada. Entre em contato com o suporte.');
      }

      // 3. Verificar senha
      const isPasswordValid = await bcrypt.compare(loginDTO.getPassword(), user.password);
      
      if (!isPasswordValid) {
        this.logger.warn('Tentativa de login com senha incorreta', {
          userId: user.id || user._id,
          email: user.email,
          ip: requestInfo.ip,
          useCase: 'LoginUserUseCase'
        });
        
        throw new Error('Credenciais inválidas');
      }

      // 4. Gerar tokens JWT
      const userData = {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        organizationType: user.organizationType
      };

      const { accessToken, refreshToken } = await this.authService.generateTokens(userData);

      // 5. Atualizar último login
      await this.userRepository.updateLastLogin(userData.id);

      // 6. Preparar resposta
      const loginResponse = {
        user: {
          id: userData.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          organizationType: user.organizationType,
          description: user.description,
          address: user.address,
          emailVerified: user.emailVerified,
          lastLoginAt: new Date()
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15m', // Access token expira em 15 minutos
          refreshExpiresIn: '7d' // Refresh token expira em 7 dias
        }
      };

      const executionTime = Date.now() - startTime;
      
      this.logger.info('Login realizado com sucesso', {
        useCase: 'LoginUserUseCase',
        userId: userData.id,
        email: userData.email,
        ip: requestInfo.ip,
        executionTime: `${executionTime}ms`
      });

      return {
        success: true,
        data: loginResponse,
        message: 'Login realizado com sucesso'
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error('Erro no processo de login', {
        useCase: 'LoginUserUseCase',
        error: error.message,
        loginData: loginDTO.toLogObject(),
        requestInfo: {
          ip: requestInfo.ip,
          userAgent: requestInfo.userAgent
        },
        executionTime: `${executionTime}ms`
      });

      // Re-throw com informação mais amigável se necessário
      if (error.message.includes('Credenciais inválidas') || 
          error.message.includes('Conta desativada')) {
        throw error;
      }

      throw new Error('Erro interno no processo de login');
    }
  }

  /**
   * Executa logout (invalidação de tokens)
   * @param {string} refreshToken - Token a ser invalidado
   * @param {Object} requestInfo - Informações do request
   * @returns {Promise<Object>} Resultado do logout
   */
  async executeLogout(refreshToken, requestInfo = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Iniciando processo de logout', {
        useCase: 'LoginUserUseCase',
        requestInfo: {
          ip: requestInfo.ip,
          userAgent: requestInfo.userAgent
        }
      });

      // Invalidar refresh token
      await this.authService.invalidateRefreshToken(refreshToken);

      const executionTime = Date.now() - startTime;
      
      this.logger.info('Logout realizado com sucesso', {
        useCase: 'LoginUserUseCase',
        ip: requestInfo.ip,
        executionTime: `${executionTime}ms`
      });

      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error('Erro no processo de logout', {
        useCase: 'LoginUserUseCase',
        error: error.message,
        requestInfo: {
          ip: requestInfo.ip,
          userAgent: requestInfo.userAgent
        },
        executionTime: `${executionTime}ms`
      });

      throw new Error('Erro interno no processo de logout');
    }
  }

  /**
   * Valida se as dependências estão disponíveis
   * @returns {boolean} True se válido
   */
  isValid() {
    return this.userRepository && 
           this.authService && 
           typeof this.userRepository.findByEmail === 'function' &&
           typeof this.authService.generateTokens === 'function';
  }

  /**
   * Retorna informações sobre o Use Case
   * @returns {Object} Metadados do Use Case
   */
  getMetadata() {
    return {
      name: 'LoginUserUseCase',
      description: 'Autentica usuário no sistema',
      version: '1.0.0',
      dependencies: ['userRepository', 'authService', 'logger'],
      inputs: ['LoginDTO', 'RequestInfo'],
      outputs: ['LoginResponse']
    };
  }
}

module.exports = LoginUserUseCase;
