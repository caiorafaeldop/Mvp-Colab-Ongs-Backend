const { logger } = require('../../infra/logger');

/**
 * CHAIN OF RESPONSIBILITY - Middleware de autenticação
 * Responsável por verificar tokens JWT e adicionar usuário ao contexto
 * Baseado no sistema do projeto Maia Advocacia
 */

const createSimpleAuthMiddleware = (authService) => {
  return async (req, res, next) => {
    const requestLogger = req.logger || logger;
    const startTime = Date.now();

    try {
      requestLogger.debug('Middleware de autenticação iniciado', {
        middleware: 'SimpleAuth',
        hasAuthHeader: !!req.headers.authorization,
      });

      // Extrair token do header Authorization
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        requestLogger.warn('Header Authorization não encontrado', {
          middleware: 'SimpleAuth',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
        return res.status(401).json({
          success: false,
          message: 'Authorization header is required',
          error: 'MISSING_AUTH_HEADER',
          requestId: req.requestId,
        });
      }

      // Verificar formato Bearer
      if (!authHeader.startsWith('Bearer ')) {
        requestLogger.warn('Formato de token inválido', {
          middleware: 'SimpleAuth',
          authHeaderPrefix: authHeader.substring(0, 10),
        });
        return res.status(401).json({
          success: false,
          message: "Invalid token format. Use 'Bearer <token>'",
          error: 'INVALID_TOKEN_FORMAT',
          requestId: req.requestId,
        });
      }

      // Extrair token
      const token = authHeader.substring(7); // Remove 'Bearer '

      if (!token) {
        requestLogger.warn('Token vazio após Bearer', {
          middleware: 'SimpleAuth',
        });
        return res.status(401).json({
          success: false,
          message: 'Token is required',
          error: 'EMPTY_TOKEN',
          requestId: req.requestId,
        });
      }

      requestLogger.debug('Token encontrado, verificando...', {
        middleware: 'SimpleAuth',
        tokenLength: token.length,
      });

      // Verificar token usando o authService
      const user = await authService.verifyAccessToken(token);

      if (!user) {
        requestLogger.warn('Usuário não encontrado para token válido', {
          middleware: 'SimpleAuth',
        });
        return res.status(401).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
          requestId: req.requestId,
        });
      }

      const duration = Date.now() - startTime;
      requestLogger.info('Usuário autenticado com sucesso', {
        middleware: 'SimpleAuth',
        userId: user.id || user._id,
        email: user.email,
        userType: user.userType,
        duration: `${duration}ms`,
      });

      // Adicionar usuário ao request
      req.user = user;

      next();
    } catch (error) {
      const duration = Date.now() - startTime;
      requestLogger.error('Erro na autenticação', {
        middleware: 'SimpleAuth',
        error: error.message,
        duration: `${duration}ms`,
        stack: error.stack,
      });

      // Diferentes tipos de erro JWT
      if (error.message.includes('expired')) {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          error: 'TOKEN_EXPIRED',
          requestId: req.requestId,
        });
      }

      if (error.message.includes('signature')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token signature',
          error: 'INVALID_SIGNATURE',
          requestId: req.requestId,
        });
      }

      if (error.message.includes('format')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
          error: 'INVALID_FORMAT',
          requestId: req.requestId,
        });
      }

      // Erro genérico
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'AUTHENTICATION_FAILED',
        requestId: req.requestId,
      });
    }
  };
};

module.exports = {
  createSimpleAuthMiddleware,
  // Alias para compatibilidade
  authMiddleware: createSimpleAuthMiddleware,
};
