const IAuthFacade = require('../../domain/facades/IAuthFacade');

/**
 * Facade para operações completas de autenticação
 * Unifica login, registro, refresh e logout com eventos automáticos
 */
class AuthFacade extends IAuthFacade {
  constructor(authService, userRepository, eventManager) {
    super();
    this.authService = authService;
    this.userRepository = userRepository;
    this.eventManager = eventManager;
  }

  /**
   * Registro completo com validações e boas-vindas
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Resultado do registro com tokens
   */
  async registerComplete(userData) {
    try {
      console.log(`[AuthFacade] Registrando usuário: ${userData.email}`);

      // 1. Registra usuário usando authService
      const result = await this.authService.register(userData);

      // 2. Busca dados completos do usuário criado
      const user = await this.userRepository.findById(result.user.id);

      // 3. Emite evento de primeiro login
      if (this.eventManager) {
        await this.eventManager.emit('user.login', {
          userId: user.id,
          user: user,
          isFirstLogin: true,
          loginTime: new Date(),
          daysSinceLastLogin: 0
        });
      }

      console.log(`[AuthFacade] Usuário registrado com sucesso: ${user.userType}`);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          phone: user.phone
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        },
        message: user.userType === 'organization' 
          ? 'ONG registrada com sucesso! Comece adicionando seus produtos.'
          : 'Conta criada com sucesso! Explore produtos de ONGs e apoie causas importantes.'
      };

    } catch (error) {
      console.error('[AuthFacade] Erro no registro:', error.message);
      
      if (this.eventManager) {
        await this.eventManager.emit('auth.attempt', {
          userId: userData.email,
          success: false,
          method: 'register',
          ip: null,
          error: error.message
        });
      }

      throw error;
    }
  }

  /**
   * Login completo com eventos e métricas
   * @param {string} email - Email do usuário
   * @param {string} password - Senha
   * @returns {Promise<Object>} Resultado do login com tokens
   */
  async loginComplete(email, password) {
    try {
      console.log(`[AuthFacade] Tentativa de login: ${email}`);

      // 1. Faz login usando authService
      const result = await this.authService.login(email, password);

      // 2. Busca dados completos do usuário
      const user = await this.userRepository.findById(result.user.id);

      // 3. Calcula dias desde último login
      const daysSinceLastLogin = this.calculateDaysSinceLastLogin(user.updatedAt);

      // 4. Emite evento de login
      if (this.eventManager) {
        await this.eventManager.emit('user.login', {
          userId: user.id,
          user: user,
          isFirstLogin: false,
          loginTime: new Date(),
          daysSinceLastLogin: daysSinceLastLogin
        });

        await this.eventManager.emit('auth.attempt', {
          userId: user.id,
          success: true,
          method: 'login',
          ip: null
        });
      }

      console.log(`[AuthFacade] Login realizado com sucesso`);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          phone: user.phone
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        },
        message: daysSinceLastLogin > 7 
          ? 'Bem-vindo de volta! Veja as novidades enquanto você estava fora.'
          : 'Login realizado com sucesso!'
      };

    } catch (error) {
      console.error('[AuthFacade] Erro no login:', error.message);
      
      if (this.eventManager) {
        await this.eventManager.emit('auth.attempt', {
          userId: email,
          success: false,
          method: 'login',
          ip: null,
          error: error.message
        });
      }

      throw error;
    }
  }

  /**
   * Refresh de token com validações
   * @param {string} refreshToken - Token de refresh
   * @returns {Promise<Object>} Novos tokens
   */
  async refreshTokenComplete(refreshToken) {
    try {
      console.log('[AuthFacade] Renovando token de acesso');

      // 1. Renova token usando authService
      const result = await this.authService.refreshToken(refreshToken);

      // 2. Busca dados do usuário
      const user = await this.userRepository.findById(result.user.id);

      console.log(`[AuthFacade] Token renovado para usuário: ${user.email}`);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      };

    } catch (error) {
      console.error('[AuthFacade] Erro ao renovar token:', error.message);
      throw error;
    }
  }

  /**
   * Logout completo com limpeza
   * @param {string} userId - ID do usuário
   * @param {string} refreshToken - Token de refresh
   * @returns {Promise<Object>} Resultado do logout
   */
  async logoutComplete(userId, refreshToken) {
    try {
      console.log(`[AuthFacade] Fazendo logout do usuário: ${userId}`);

      // 1. Busca dados do usuário para métricas
      const user = await this.userRepository.findById(userId);
      const loginTime = user.updatedAt || new Date();
      const sessionDuration = Math.floor((new Date() - new Date(loginTime)) / (1000 * 60)); // em minutos

      // 2. Faz logout usando authService
      await this.authService.logout(refreshToken);

      // 3. Emite evento de logout
      if (this.eventManager) {
        await this.eventManager.emit('user.logout', {
          userId: userId,
          logoutTime: new Date(),
          sessionDuration: sessionDuration
        });
      }

      console.log(`[AuthFacade] Logout realizado com sucesso`);

      return {
        success: true,
        message: 'Logout realizado com sucesso!'
      };

    } catch (error) {
      console.error('[AuthFacade] Erro no logout:', error.message);
      throw error;
    }
  }

  /**
   * Validação completa de sessão
   * @param {string} accessToken - Token de acesso
   * @returns {Promise<Object>} Dados do usuário validado
   */
  async validateSessionComplete(accessToken) {
    try {
      // 1. Valida token usando authService
      const decoded = await this.authService.verifyToken(accessToken);

      // 2. Busca dados completos do usuário
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          phone: user.phone
        },
        tokenValid: true
      };

    } catch (error) {
      console.error('[AuthFacade] Token inválido:', error.message);
      
      return {
        success: false,
        tokenValid: false,
        error: error.message
      };
    }
  }

  /**
   * Calcula dias desde último login
   * @param {Date} lastLogin - Data do último login
   * @returns {number} Dias desde último login
   */
  calculateDaysSinceLastLogin(lastLogin) {
    if (!lastLogin) return 0;
    
    const now = new Date();
    const diffTime = Math.abs(now - new Date(lastLogin));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}

module.exports = AuthFacade;
