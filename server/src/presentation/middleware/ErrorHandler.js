const { logger } = require('../../infra/logger');

/**
 * CHAIN OF RESPONSIBILITY - Error Handler
 * Último elo da cadeia, responsável por tratar todos os erros não capturados
 */

/**
 * Categoriza tipos de erro para melhor tratamento
 * @param {Error} error - Erro a ser categorizado
 * @returns {Object} Categoria e detalhes do erro
 */
function categorizeError(error) {
  // Erros de validação (Zod, Joi, etc.)
  if (error.name === 'ZodError') {
    return {
      category: 'VALIDATION_ERROR',
      statusCode: 400,
      userMessage: 'Dados fornecidos são inválidos',
      details: error.errors?.map(err => ({
        field: err.path?.join('.'),
        message: err.message,
        code: err.code
      }))
    };
  }
  
  // Erros de autenticação JWT
  if (error.name === 'JsonWebTokenError' || error.message?.includes('token')) {
    return {
      category: 'AUTHENTICATION_ERROR',
      statusCode: 401,
      userMessage: 'Token de autenticação inválido ou expirado',
      details: { tokenError: error.message }
    };
  }
  
  // Erros de autorização
  if (error.message?.includes('permission') || error.message?.includes('access')) {
    return {
      category: 'AUTHORIZATION_ERROR',
      statusCode: 403,
      userMessage: 'Acesso negado para este recurso'
    };
  }
  
  // Erros de banco de dados
  if (error.name === 'MongoError' || error.name === 'ValidationError') {
    return {
      category: 'DATABASE_ERROR',
      statusCode: 500,
      userMessage: 'Erro interno do servidor',
      details: process.env.NODE_ENV !== 'production' ? { dbError: error.message } : undefined
    };
  }
  
  // Erros de rede/API externa
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return {
      category: 'EXTERNAL_SERVICE_ERROR',
      statusCode: 503,
      userMessage: 'Serviço temporariamente indisponível'
    };
  }
  
  // Erros de negócio customizados
  if (error.status && error.status < 500) {
    return {
      category: 'BUSINESS_ERROR',
      statusCode: error.status,
      userMessage: error.message
    };
  }
  
  // Erro interno genérico
  return {
    category: 'INTERNAL_ERROR',
    statusCode: 500,
    userMessage: 'Erro interno do servidor'
  };
}

/**
 * Handler principal de erros - final da cadeia de responsabilidade
 * @param {Error} err - Erro capturado
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Função next (não usada, é o final da cadeia)
 */
function errorHandler(err, req, res, next) {
  const requestLogger = req.logger || logger;
  const requestId = req.requestId || 'unknown';
  const duration = req.startTime ? Date.now() - req.startTime : 0;
  
  // Categorizar erro
  const errorInfo = categorizeError(err);
  
  // Log estruturado do erro
  const logData = {
    requestId,
    category: errorInfo.category,
    statusCode: errorInfo.statusCode,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    duration: `${duration}ms`,
    userId: req.user?.id || req.user?._id,
    timestamp: new Date().toISOString(),
    originalError: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    }
  };
  
  // Log baseado na severidade
  if (errorInfo.statusCode >= 500) {
    requestLogger.error('Erro interno capturado pelo error handler', logData);
  } else if (errorInfo.statusCode >= 400) {
    requestLogger.warn('Erro de cliente capturado pelo error handler', logData);
  } else {
    requestLogger.info('Erro capturado pelo error handler', logData);
  }
  
  // Preparar resposta para o cliente
  const errorResponse = {
    success: false,
    message: errorInfo.userMessage,
    error: errorInfo.category,
    requestId,
    timestamp: new Date().toISOString()
  };
  
  // Adicionar detalhes se disponíveis e ambiente apropriado
  if (errorInfo.details && (process.env.NODE_ENV !== 'production' || errorInfo.statusCode < 500)) {
    errorResponse.details = errorInfo.details;
  }
  
  // Adicionar stack trace em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  // Verificar se headers já foram enviados
  if (res.headersSent) {
    requestLogger.warn('Headers já enviados, não é possível enviar resposta de erro', {
      requestId,
      error: err.message
    });
    return;
  }
  
  // Enviar resposta de erro
  res.status(errorInfo.statusCode).json(errorResponse);
}

/**
 * Handler para rotas não encontradas (404)
 * Middleware que deve ser usado antes do errorHandler
 */
function notFoundHandler(req, res, next) {
  const requestLogger = req.logger || logger;
  
  requestLogger.warn('Rota não encontrada', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  const error = new Error(`Rota ${req.method} ${req.url} não encontrada`);
  error.status = 404;
  next(error);
}

/**
 * Handler para erros assíncronos não capturados
 * Wrapper para funções async em rotas
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  categorizeError
};
