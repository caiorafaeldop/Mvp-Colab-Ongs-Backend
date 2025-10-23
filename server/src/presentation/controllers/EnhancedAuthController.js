const { CreateUserDTO, LoginDTO } = require('../../application/dtos');
const {
  RegisterUserUseCase,
  LoginUserUseCase,
  VerifyEmailUseCase,
} = require('../../application/use-cases');
const { logger } = require('../../infra/logger');
const {
  getVerificationCodeRepository,
} = require('../../infra/repositories/VerificationCodeRepository');
const { getEmailService } = require('../../infra/services/EmailService');

/**
 * Controller de autenticação usando as novas melhorias:
 * - DTOs para validação
 * - Use Cases para lógica de negócio
 * - Logger centralizado
 * - Rate limiting (aplicado nas rotas)
 */
class EnhancedAuthController {
  constructor(userRepository, authService) {
    this.userRepository = userRepository;
    this.authService = authService;

    // Criar VerifyEmailUseCase
    const verificationCodeRepository = getVerificationCodeRepository();
    const emailService = getEmailService();
    const verifyEmailUseCase = new VerifyEmailUseCase(
      userRepository,
      verificationCodeRepository,
      emailService
    );

    // Criar Use Cases com dependências injetadas
    this.registerUserUseCase = new RegisterUserUseCase(userRepository, logger, verifyEmailUseCase);
    this.loginUserUseCase = new LoginUserUseCase(userRepository, authService, logger);

    // Bind dos métodos para preservar contexto
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.getProfile = this.getProfile.bind(this);
  }

  /**
   * Registro de usuário
   * Usa CreateUserDTO para validação e RegisterUserUseCase para lógica
   */
  async register(req, res) {
    const requestLogger = req.logger || logger;

    try {
      requestLogger.info('Iniciando registro de usuário', {
        controller: 'EnhancedAuthController',
        action: 'register',
        ip: req.ip,
      });

      // Os dados já foram validados pelo middleware validateDTO(CreateUserDTO)
      const createUserDTO = req.validatedData;

      // Executar Use Case
      const result = await this.registerUserUseCase.execute(createUserDTO);

      requestLogger.info('Usuário registrado com sucesso', {
        controller: 'EnhancedAuthController',
        action: 'register',
        userId: result.user.id,
        email: result.user.email,
      });

      res.status(201).json(result);
    } catch (error) {
      requestLogger.error('Erro no registro de usuário', {
        controller: 'EnhancedAuthController',
        action: 'register',
        error: error.message,
        stack: error.stack,
      });

      // Tratar erros conhecidos
      if (error.message === 'Email já está em uso') {
        return res.status(409).json({
          success: false,
          message: error.message,
          error: 'EMAIL_ALREADY_EXISTS',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * Login de usuário
   * Usa LoginDTO para validação e LoginUserUseCase para lógica
   */
  async login(req, res) {
    const requestLogger = req.logger || logger;

    try {
      requestLogger.info('Iniciando login de usuário', {
        controller: 'EnhancedAuthController',
        action: 'login',
        ip: req.ip,
      });

      // Os dados já foram validados pelo middleware validateDTO(LoginDTO)
      const loginDTO = req.validatedData;

      // Informações do request para auditoria
      const requestInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      };

      // Executar Use Case
      const result = await this.loginUserUseCase.execute(loginDTO, requestInfo);

      // Configurar cookie httpOnly com refresh token
      res.cookie('refreshToken', result.data.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });

      requestLogger.info('Login realizado com sucesso', {
        controller: 'EnhancedAuthController',
        action: 'login',
        userId: result.data.user.id,
        email: result.data.user.email,
      });

      // Não retornar refresh token no body (já está no cookie)
      const response = {
        ...result,
        data: {
          ...result.data,
          tokens: {
            accessToken: result.data.tokens.accessToken,
            expiresIn: result.data.tokens.expiresIn,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      requestLogger.error('Erro no login de usuário', {
        controller: 'EnhancedAuthController',
        action: 'login',
        error: error.message,
      });

      // Tratar erros conhecidos
      if (error.message === 'Credenciais inválidas') {
        return res.status(401).json({
          success: false,
          message: error.message,
          error: 'INVALID_CREDENTIALS',
        });
      }

      if (error.message.includes('Conta desativada')) {
        return res.status(403).json({
          success: false,
          message: error.message,
          error: 'ACCOUNT_DISABLED',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * Logout de usuário
   * Usa LoginUserUseCase para invalidar tokens
   */
  async logout(req, res) {
    const requestLogger = req.logger || logger;

    try {
      requestLogger.info('Iniciando logout de usuário', {
        controller: 'EnhancedAuthController',
        action: 'logout',
        userId: req.user?.id,
        ip: req.ip,
      });

      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        const requestInfo = {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        };

        await this.loginUserUseCase.executeLogout(refreshToken, requestInfo);
      }

      // Limpar cookie
      res.clearCookie('refreshToken');

      requestLogger.info('Logout realizado com sucesso', {
        controller: 'EnhancedAuthController',
        action: 'logout',
        userId: req.user?.id,
      });

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      requestLogger.error('Erro no logout de usuário', {
        controller: 'EnhancedAuthController',
        action: 'logout',
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * Renovação de token de acesso
   */
  async refreshToken(req, res) {
    const requestLogger = req.logger || logger;

    try {
      requestLogger.info('Iniciando renovação de token', {
        controller: 'EnhancedAuthController',
        action: 'refreshToken',
        ip: req.ip,
      });

      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token não encontrado',
          error: 'REFRESH_TOKEN_MISSING',
        });
      }

      // Verificar e renovar tokens
      const result = await this.authService.refreshAccessToken(refreshToken);

      requestLogger.info('Token renovado com sucesso', {
        controller: 'EnhancedAuthController',
        action: 'refreshToken',
        userId: result.user.id,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          expiresIn: '15m',
          user: result.user,
        },
        message: 'Token renovado com sucesso',
      });
    } catch (error) {
      requestLogger.error('Erro na renovação de token', {
        controller: 'EnhancedAuthController',
        action: 'refreshToken',
        error: error.message,
      });

      // Limpar cookie inválido
      res.clearCookie('refreshToken');

      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado',
        error: 'INVALID_REFRESH_TOKEN',
      });
    }
  }

  /**
   * Obter perfil do usuário autenticado
   */
  async getProfile(req, res) {
    const requestLogger = req.logger || logger;

    try {
      requestLogger.info('Obtendo perfil do usuário', {
        controller: 'EnhancedAuthController',
        action: 'getProfile',
        userId: req.user.id,
      });

      // Buscar dados atualizados do usuário
      const user = await this.userRepository.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
          error: 'USER_NOT_FOUND',
        });
      }

      // Remover dados sensíveis
      const { password, ...userProfile } = user;

      requestLogger.info('Perfil obtido com sucesso', {
        controller: 'EnhancedAuthController',
        action: 'getProfile',
        userId: user.id,
      });

      res.status(200).json({
        success: true,
        data: { user: userProfile },
        message: 'Perfil obtido com sucesso',
      });
    } catch (error) {
      requestLogger.error('Erro ao obter perfil', {
        controller: 'EnhancedAuthController',
        action: 'getProfile',
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR',
      });
    }
  }

  /**
   * Retorna informações sobre o controller
   */
  getControllerInfo() {
    return {
      name: 'EnhancedAuthController',
      version: '2.0.0',
      features: [
        'DTO Validation',
        'Use Cases',
        'Centralized Logging',
        'Rate Limiting Ready',
        'Enhanced Error Handling',
      ],
      endpoints: ['POST /register', 'POST /login', 'POST /logout', 'POST /refresh', 'GET /profile'],
    };
  }
}

module.exports = EnhancedAuthController;
