/**
 * Middleware de autenticação simplificado
 * Baseado no sistema do projeto Maia Advocacia
 * Verifica apenas tokens JWT no header Authorization
 */

const createSimpleAuthMiddleware = (authService) => {
  return async (req, res, next) => {
    try {
      console.log("[SIMPLE AUTH MIDDLEWARE] Verificando autenticação");
      
      // Extrair token do header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        console.log("[SIMPLE AUTH MIDDLEWARE] Header Authorization não encontrado");
        return res.status(401).json({
          success: false,
          message: "Authorization header is required",
        });
      }

      // Verificar formato Bearer
      if (!authHeader.startsWith('Bearer ')) {
        console.log("[SIMPLE AUTH MIDDLEWARE] Formato de token inválido");
        return res.status(401).json({
          success: false,
          message: "Invalid token format. Use 'Bearer <token>'",
        });
      }

      // Extrair token
      const token = authHeader.substring(7); // Remove 'Bearer '
      
      if (!token) {
        console.log("[SIMPLE AUTH MIDDLEWARE] Token não encontrado");
        return res.status(401).json({
          success: false,
          message: "Token is required",
        });
      }

      console.log("[SIMPLE AUTH MIDDLEWARE] Token encontrado, verificando...");

      // Verificar token usando o authService
      const user = await authService.verifyAccessToken(token);
      
      if (!user) {
        console.log("[SIMPLE AUTH MIDDLEWARE] Usuário não encontrado");
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      console.log("[SIMPLE AUTH MIDDLEWARE] Usuário autenticado:", {
        id: user.id || user._id,
        email: user.email,
        userType: user.userType
      });

      // Adicionar usuário ao request
      req.user = user;
      
      next();
      
    } catch (error) {
      console.error("[SIMPLE AUTH MIDDLEWARE] Erro na autenticação:", error.message);
      
      // Diferentes tipos de erro JWT
      if (error.message.includes('expired')) {
        return res.status(401).json({
          success: false,
          message: "Token expired",
          code: "TOKEN_EXPIRED"
        });
      }
      
      if (error.message.includes('signature')) {
        return res.status(401).json({
          success: false,
          message: "Invalid token signature",
          code: "INVALID_SIGNATURE"
        });
      }
      
      if (error.message.includes('format')) {
        return res.status(401).json({
          success: false,
          message: "Invalid token format",
          code: "INVALID_FORMAT"
        });
      }

      // Erro genérico
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        code: "AUTHENTICATION_FAILED"
      });
    }
  };
};

module.exports = {
  createSimpleAuthMiddleware,
  // Alias para compatibilidade
  authMiddleware: createSimpleAuthMiddleware
};
