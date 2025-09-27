/**
 * Controller de Autenticação Simplificado
 * Baseado no sistema do projeto Maia Advocacia
 * Sem cookies complexos, apenas tokens JWT limpos
 */
class SimpleAuthController {
  constructor(authService) {
    if (!authService) {
      throw new Error('AuthService is required');
    }
    this.authService = authService;
    console.log('[SIMPLE AUTH CONTROLLER] Inicializado com AuthService');
  }

  /**
   * Endpoint de login simplificado
   */
  login = async (req, res) => {
    try {
      console.log("[SIMPLE AUTH CONTROLLER] Login iniciado");
      
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Delega para o service
      const result = await this.authService.login(email, password);
      
      console.log("[SIMPLE AUTH CONTROLLER] Login concluído com sucesso");

      // Resposta limpa sem cookies
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
      
    } catch (error) {
      console.error("[SIMPLE AUTH CONTROLLER] Erro no login:", error.message);
      res.status(401).json({
        success: false,
        message: error.message.includes('Invalid credentials') ? 'Invalid credentials' : 'Login failed',
      });
    }
  };

  /**
   * Endpoint de registro simplificado
   */
  register = async (req, res) => {
    try {
      console.log("[SIMPLE AUTH CONTROLLER] Registro iniciado");
      
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body is required",
        });
      }

      // Delega para o service
      const result = await this.authService.register(req.body);
      
      console.log("[SIMPLE AUTH CONTROLLER] Registro concluído com sucesso");

      // Resposta limpa
      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
      
    } catch (error) {
      console.error("[SIMPLE AUTH CONTROLLER] Erro no registro:", error.message);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Endpoint para renovar tokens
   */
  refresh = async (req, res) => {
    try {
      console.log("[SIMPLE AUTH CONTROLLER] Refresh iniciado");
      
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      // Delega para o service
      const result = await this.authService.refreshTokens(refreshToken);
      
      console.log("[SIMPLE AUTH CONTROLLER] Tokens renovados com sucesso");

      res.status(200).json({
        success: true,
        message: "Tokens refreshed successfully",
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
      
    } catch (error) {
      console.error("[SIMPLE AUTH CONTROLLER] Erro no refresh:", error.message);
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  };

  /**
   * Endpoint para obter perfil do usuário autenticado
   */
  getProfile = async (req, res) => {
    try {
      console.log("[SIMPLE AUTH CONTROLLER] Obtendo perfil do usuário");
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Preparar dados do usuário (remover informações sensíveis)
      const userData = {
        id: req.user.id || req.user._id,
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
        data: {
          user: userData,
        },
      });
      
    } catch (error) {
      console.error("[SIMPLE AUTH CONTROLLER] Erro ao obter perfil:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve profile",
      });
    }
  };

  /**
   * Endpoint de logout simplificado
   */
  logout = async (req, res) => {
    try {
      console.log("[SIMPLE AUTH CONTROLLER] Logout iniciado");
      
      // Logout simples - apenas confirma a ação
      // O frontend deve descartar os tokens
      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
      
      console.log("[SIMPLE AUTH CONTROLLER] Logout concluído com sucesso");
    } catch (error) {
      console.error("[SIMPLE AUTH CONTROLLER] Erro no logout:", error.message);
      res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
  };
}

module.exports = SimpleAuthController;
