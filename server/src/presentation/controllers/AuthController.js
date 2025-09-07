const Validators = require("../../utils/validators");

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register = async (req, res) => {
    try {
      console.log("[REGISTER] Request body:", req.body);
      const userData = Validators.sanitizeObject(req.body);
      const { name, email, password, userType, phone } = userData;
      console.log("[REGISTER] Sanitized userData:", userData);

      // Validate user data
      const validation = Validators.validateUserRegistration(userData);
      console.log("[REGISTER] Validation result:", validation);
      if (!validation.isValid) {
        console.log("[REGISTER] Validation failed:", validation.errors);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const result = await this.authService.register(userData);
      console.log("[REGISTER] Registration result:", result);

      // Set refresh token as httpOnly cookie for security
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true, // Cannot be accessed via JavaScript
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? 'none' : 'lax', // 'none' para cross-origin em produção
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      console.error("[REGISTER] Error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  login = async (req, res) => {
    try {
      console.log("[LOGIN] Request body:", req.body);
      const loginData = Validators.sanitizeObject(req.body);
      const { email, password } = loginData;
      console.log("[LOGIN] Sanitized loginData:", loginData);

      // Validate login data
      const validation = Validators.validateLogin(loginData);
      console.log("[LOGIN] Validation result:", validation);
      if (!validation.isValid) {
        console.log("[LOGIN] Validation failed:", validation.errors);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const result = await this.authService.login(
        loginData.email,
        loginData.password
      );
      console.log("[LOGIN] Login result:", result);

      // Set refresh token as httpOnly cookie for security
      const isProduction = process.env.NODE_ENV === 'production';
      console.log('[LOGIN] Configurando cookie - NODE_ENV:', process.env.NODE_ENV);
      console.log('[LOGIN] isProduction:', isProduction);
      
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true, // Cannot be accessed via JavaScript
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? 'none' : 'lax', // 'none' para cross-origin em produção
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });
      
      console.log('[LOGIN] Cookie configurado com sameSite:', isProduction ? 'none' : 'lax');

      // Return access token and user data (not refresh token)
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      console.error("[LOGIN] Error:", error);
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  };

  getProfile = async (req, res) => {
    try {
      console.log("[PROFILE CONTROLLER] req.user:", req.user);
      console.log("[PROFILE CONTROLLER] req.user.id:", req.user.id);
      console.log("[PROFILE CONTROLLER] req.user._id:", req.user._id);
      
      const userData = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        userType: req.user.userType,
        phone: req.user.phone,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      };
      
      console.log("[PROFILE CONTROLLER] userData preparado:", userData);
      
      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: userData,
      });
    } catch (error) {
      console.error("[PROFILE CONTROLLER] Erro:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching profile",
      });
    }
  };

  refreshToken = async (req, res) => {
    try {
      console.log("[REFRESH CONTROLLER] Cookies recebidos:", req.cookies);
      const refreshToken = req.cookies.refreshToken;
      console.log("[REFRESH CONTROLLER] Refresh token extraído:", refreshToken ? 'PRESENTE' : 'AUSENTE');
      
      if (!refreshToken) {
        console.log("[REFRESH CONTROLLER] Refresh token não encontrado nos cookies");
        return res.status(401).json({
          success: false,
          message: "Refresh token not found",
        });
      }

      console.log("[REFRESH CONTROLLER] Chamando authService.refreshAccessToken");
      const result = await this.authService.refreshAccessToken(refreshToken);
      console.log("[REFRESH CONTROLLER] Resultado do refresh:", result);
      
      console.log("[REFRESH CONTROLLER] User object antes do JSON:", result.user);
      console.log("[REFRESH CONTROLLER] user.id:", result.user.id);
      console.log("[REFRESH CONTROLLER] user._id:", result.user._id);
      
      const userData = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        userType: result.user.userType,
        phone: result.user.phone,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt
      };
      
      console.log("[REFRESH CONTROLLER] userData preparado:", userData);

      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          user: userData,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      console.error("[REFRESH CONTROLLER] Erro no refresh:", error);
      console.error("[REFRESH CONTROLLER] Erro message:", error.message);
      // Clear invalid refresh token
      res.clearCookie('refreshToken');
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  };

  logout = async (req, res) => {
    try {
      // Clear the refresh token cookie
      res.clearCookie('refreshToken');
      
      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("[LOGOUT] Error:", error);
      res.status(500).json({
        success: false,
        message: "Error during logout",
      });
    }
  };
}

module.exports = AuthController;
