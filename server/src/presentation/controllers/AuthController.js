/**
 * Controller de Autenticação seguindo Clean Architecture
 * Responsável apenas por receber requests HTTP e delegar para o service
 * Não contém lógica de negócio ou validações complexas
 */
class AuthController {
  constructor(authService) {
    if (!authService) {
      throw new Error('AuthService is required');
    }
    this.authService = authService;
    console.log('[AUTH CONTROLLER] Inicializado com AuthService');
  }

  /**
   * Endpoint de registro de usuário
   * Delega toda a lógica para o AuthService
   */
  register = async (req, res) => {
    try {
      console.log("[AUTH CONTROLLER] Registro iniciado");
      
      // Validação básica de entrada
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body is required",
        });
      }

      // Delega para o service (que fará validações e lógica de negócio)
      const result = await this.authService.register(req.body);
      console.log("[AUTH CONTROLLER] Registro concluído com sucesso");

      // Configurar cookie seguro para refresh token
      this._setRefreshTokenCookie(res, result.refreshToken);

      // Retornar resposta de sucesso
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
      
    } catch (error) {
      console.error("[AUTH CONTROLLER] Erro no registro:", error.message);
      this._handleError(res, error, 400);
    }
  };

  /**
   * Endpoint de login de usuário
   * Delega toda a lógica para o AuthService
   */
  login = async (req, res) => {
    try {
      console.log("[AUTH CONTROLLER] Login iniciado");
      
      // Validação básica de entrada
      if (!req.body || !req.body.email || !req.body.password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Delega para o service (que fará validações e lógica de negócio)
      const result = await this.authService.login(req.body.email, req.body.password);
      console.log("[AUTH CONTROLLER] Login concluído com sucesso");

      // Configurar cookie seguro para refresh token
      this._setRefreshTokenCookie(res, result.refreshToken);

      // Retornar resposta de sucesso
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
      
    } catch (error) {
      console.error("[AUTH CONTROLLER] Erro no login:", error.message);
      this._handleError(res, error, 401);
    }
  };

  /**
   * Endpoint para obter perfil do usuário autenticado
   */
  getProfile = async (req, res) => {
    try {
      console.log("[AUTH CONTROLLER] Obtendo perfil do usuário");
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Preparar dados do usuário (remover informações sensíveis)
      const userData = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        userType: req.user.userType,
        phone: req.user.phone,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      };
      
      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: userData,
      });
      
    } catch (error) {
      console.error("[AUTH CONTROLLER] Erro ao obter perfil:", error.message);
      this._handleError(res, error, 500);
    }
  };

  /**
   * Endpoint para renovar access token usando refresh token
   */
  refreshToken = async (req, res) => {
    try {
      console.log("[AUTH CONTROLLER] Renovação de token iniciada");
      
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        console.log("[AUTH CONTROLLER] Refresh token não encontrado, limpando cookie");
        res.clearCookie('refreshToken');
        return res.status(401).json({
          success: false,
          message: "Refresh token not found",
          shouldLogout: true // Sinaliza para o frontend fazer logout
        });
      }

      // Delega para o service
      const result = await this.authService.refreshAccessToken(refreshToken);
      console.log("[AUTH CONTROLLER] Token renovado com sucesso");
      
      // Preparar dados do usuário
      const userData = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        userType: result.user.userType,
        phone: result.user.phone,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt
      };

      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          user: userData,
          accessToken: result.accessToken,
        },
      });
      
    } catch (error) {
      console.error("[AUTH CONTROLLER] Erro na renovação:", error.message);
      // Limpar refresh token inválido
      res.clearCookie('refreshToken');
      
      // Resposta específica para evitar loops
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
        shouldLogout: true // Sinaliza para o frontend fazer logout completo
      });
    }
  };

  /**
   * Endpoint de logout
   */
  logout = async (req, res) => {
    try {
      console.log("[AUTH CONTROLLER] Logout iniciado");
      
      // Limpar refresh token cookie
      res.clearCookie('refreshToken');
      
      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
      
      console.log("[AUTH CONTROLLER] Logout concluído com sucesso");
    } catch (error) {
      console.error("[AUTH CONTROLLER] Erro no logout:", error.message);
      this._handleError(res, error, 500);
    }
  };

  /**
   * Método privado para configurar cookie de refresh token
   * @param {Response} res - Objeto de resposta Express
   * @param {string} refreshToken - Token de refresh
   * @private
   */
  _setRefreshTokenCookie(res, refreshToken) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });
    
    console.log('[AUTH CONTROLLER] Cookie configurado:', {
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });
  }

  /**
   * Método privado para tratamento de erros
   * @param {Response} res - Objeto de resposta Express
   * @param {Error} error - Erro ocorrido
   * @param {number} statusCode - Código de status HTTP
   * @private
   */
  _handleError(res, error, statusCode = 500) {
    const errorMessage = error.message || 'Internal server error';
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
}

module.exports = AuthController;
