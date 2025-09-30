const { BaseTemplate } = require('./BaseTemplate');
const { logger } = require('../../infra/logger');

/**
 * TEMPLATE METHOD - Template para processos de autenticação
 * Define o fluxo padrão: validar → verificar → processar → emitir tokens
 */

class AuthenticationTemplate extends BaseTemplate {
  constructor(options = {}) {
    super('Authentication');
    this.userRepository = options.userRepository;
    this.authService = options.authService;
    this.eventManager = options.eventManager;
  }

  /**
   * Valida os dados de entrada
   */
  async validate() {
    this.setCurrentStep('validation');
    const { email, password } = this.context.input;

    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }

    // Validações específicas do tipo de autenticação
    await this.validateCredentials();

    this.requestLogger.debug('Credenciais validadas', {
      template: this.name,
      email,
      type: this.getAuthenticationType(),
    });
  }

  /**
   * Prepara os dados para autenticação
   */
  async prepare() {
    this.setCurrentStep('preparation');
    const { email } = this.context.input;

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();
    this.setContextData('normalizedEmail', normalizedEmail);

    // Preparar contexto de segurança
    const securityContext = {
      ip: this.context.options.ip,
      userAgent: this.context.options.userAgent,
      timestamp: new Date(),
      type: this.getAuthenticationType(),
    };

    this.setContextData('securityContext', securityContext);

    this.requestLogger.debug('Dados preparados para autenticação', {
      template: this.name,
      email: normalizedEmail,
      type: this.getAuthenticationType(),
    });
  }

  /**
   * Executa o processo de autenticação
   */
  async process() {
    this.setCurrentStep('main_process');

    // Executar autenticação específica
    const authResult = await this.performAuthentication();

    // Gerar tokens
    const tokens = await this.generateTokens(authResult.user);

    // Preparar resultado
    const result = {
      user: this.sanitizeUser(authResult.user),
      tokens,
      authType: this.getAuthenticationType(),
      authenticatedAt: new Date().toISOString(),
    };

    this.requestLogger.info('Autenticação realizada com sucesso', {
      template: this.name,
      userId: authResult.user.id || authResult.user._id,
      email: authResult.user.email,
      type: this.getAuthenticationType(),
    });

    return result;
  }

  /**
   * Finaliza o processo de autenticação
   */
  async finalize() {
    this.setCurrentStep('finalization');
    const result = this.context.result;

    // Registrar evento de autenticação
    await this.logAuthenticationEvent(result);

    // Atualizar estatísticas do usuário
    await this.updateUserStats(result.user);

    // Adicionar metadados
    this.addMetadata('authSuccess', true);
    this.addMetadata('userId', result.user.id || result.user._id);
    this.addMetadata('authType', result.authType);

    this.requestLogger.debug('Autenticação finalizada', {
      template: this.name,
      userId: result.user.id || result.user._id,
    });
  }

  // ==========================================
  // MÉTODOS ABSTRATOS (devem ser implementados pelas subclasses)
  // ==========================================

  /**
   * Retorna o tipo de autenticação
   * @abstract
   * @returns {string} Tipo de autenticação
   */
  getAuthenticationType() {
    throw new Error(
      `Method getAuthenticationType() must be implemented by ${this.constructor.name}`
    );
  }

  /**
   * Valida credenciais específicas
   * @abstract
   */
  async validateCredentials() {
    throw new Error(`Method validateCredentials() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Executa a autenticação específica
   * @abstract
   * @returns {Object} Resultado da autenticação
   */
  async performAuthentication() {
    throw new Error(
      `Method performAuthentication() must be implemented by ${this.constructor.name}`
    );
  }

  // ==========================================
  // MÉTODOS UTILITÁRIOS
  // ==========================================

  /**
   * Gera tokens de acesso e refresh
   */
  async generateTokens(user) {
    if (!this.authService) {
      throw new Error('AuthService não configurado');
    }

    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.authService.getAccessTokenExpiration(),
      tokenType: 'Bearer',
    };
  }

  /**
   * Remove dados sensíveis do usuário
   */
  sanitizeUser(user) {
    const { password, refreshTokens, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Registra evento de autenticação
   */
  async logAuthenticationEvent(result) {
    if (this.eventManager) {
      await this.eventManager.emit('user.authenticated', {
        userId: result.user.id || result.user._id,
        email: result.user.email,
        type: result.authType,
        timestamp: new Date(),
        ip: this.getContextData('securityContext').ip,
      });
    }
  }

  /**
   * Atualiza estatísticas do usuário
   */
  async updateUserStats(user) {
    if (this.userRepository) {
      try {
        await this.userRepository.updateById(user.id || user._id, {
          lastLoginAt: new Date(),
          loginCount: (user.loginCount || 0) + 1,
        });
      } catch (error) {
        this.requestLogger.warn('Erro ao atualizar estatísticas do usuário', {
          template: this.name,
          userId: user.id || user._id,
          error: error.message,
        });
      }
    }
  }

  /**
   * Hook executado em caso de erro
   */
  async onError(error) {
    const email = this.getContextData('normalizedEmail');

    this.requestLogger.error('Erro durante autenticação', {
      template: this.name,
      email,
      error: error.message,
      step: this.getCurrentStep(),
    });

    // Registrar tentativa de autenticação falhada
    if (this.eventManager) {
      await this.eventManager.emit('user.authentication_failed', {
        email,
        error: error.message,
        type: this.getAuthenticationType(),
        timestamp: new Date(),
        ip: this.getContextData('securityContext')?.ip,
      });
    }
  }
}

/**
 * Template para login de usuário existente
 */
class LoginTemplate extends AuthenticationTemplate {
  constructor(options = {}) {
    super(options);
  }

  getAuthenticationType() {
    return 'login';
  }

  async validateCredentials() {
    const { password } = this.context.input;

    // Validar força da senha (mínimo para login)
    if (password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }
  }

  async performAuthentication() {
    const normalizedEmail = this.getContextData('normalizedEmail');
    const { password } = this.context.input;

    // Buscar usuário
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = await this.authService.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar se usuário está ativo
    if (user.status === 'inactive') {
      throw new Error('Conta inativa. Entre em contato com o suporte.');
    }

    return { user };
  }
}

/**
 * Template para registro de novo usuário
 */
class RegisterTemplate extends AuthenticationTemplate {
  constructor(options = {}) {
    super(options);
  }

  getAuthenticationType() {
    return 'register';
  }

  async validateCredentials() {
    const { password, confirmPassword, name } = this.context.input;

    if (!name || name.trim().length < 2) {
      throw new Error('Nome deve ter pelo menos 2 caracteres');
    }

    // Validar força da senha
    if (password.length < 8) {
      throw new Error('Senha deve ter pelo menos 8 caracteres');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error(
        'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
      );
    }

    if (password !== confirmPassword) {
      throw new Error('Senhas não coincidem');
    }
  }

  async performAuthentication() {
    const normalizedEmail = this.getContextData('normalizedEmail');
    const { password, name, userType } = this.context.input;

    // Verificar se usuário já existe
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('Usuário já existe com este email');
    }

    // Hash da senha
    const hashedPassword = await this.authService.hashPassword(password);

    // Criar usuário
    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      userType: userType || 'individual',
      status: 'active',
      createdAt: new Date(),
      loginCount: 0,
    };

    const user = await this.userRepository.create(userData);

    return { user };
  }

  /**
   * Hook executado após criação do usuário
   */
  async afterMainProcess() {
    const result = this.context.result;

    // Enviar email de boas-vindas
    await this.sendWelcomeEmail(result.user);

    // Registrar evento de novo usuário
    if (this.eventManager) {
      await this.eventManager.emit('user.registered', {
        userId: result.user.id || result.user._id,
        email: result.user.email,
        userType: result.user.userType,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Envia email de boas-vindas
   */
  async sendWelcomeEmail(user) {
    // Implementação do envio de email
    this.requestLogger.info('Email de boas-vindas enviado', {
      template: this.name,
      userId: user.id || user._id,
      email: user.email,
    });
  }
}

module.exports = {
  AuthenticationTemplate,
  LoginTemplate,
  RegisterTemplate,
};
