const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../infra/logger');

/**
 * CHAIN OF RESPONSIBILITY - Middleware de correlação de requests
 * Adiciona requestId único para rastrear requests ao longo da cadeia de middlewares
 */

/**
 * Middleware que adiciona correlação de requestId
 * Primeira responsabilidade na cadeia - identifica e rastreia requests
 */
const requestCorrelationMiddleware = (req, res, next) => {
  // Gerar ou usar requestId existente
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  // Adicionar ao request para uso em toda a cadeia
  req.requestId = requestId;
  req.startTime = Date.now();
  
  // Criar logger contextual para este request
  req.logger = {
    info: (message, meta = {}) => logger.info(message, { requestId, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { requestId, ...meta }),
    error: (message, meta = {}) => logger.error(message, { requestId, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { requestId, ...meta })
  };
  
  // Adicionar header de resposta para rastreamento
  res.setHeader('X-Request-ID', requestId);
  
  // Log inicial do request
  req.logger.info('Request iniciado', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Interceptar final da response para log de conclusão
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - req.startTime;
    
    req.logger.info('Request finalizado', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Middleware para adicionar contexto adicional ao request
 * Segunda responsabilidade na cadeia - enriquece contexto
 */
const requestContextMiddleware = (req, res, next) => {
  const requestLogger = req.logger || logger;
  
  // Adicionar informações de contexto
  req.context = {
    requestId: req.requestId,
    timestamp: new Date(),
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };
  
  requestLogger.debug('Contexto do request criado', {
    middleware: 'requestContext',
    path: req.path,
    hasQuery: Object.keys(req.query).length > 0,
    hasBody: !!req.body && Object.keys(req.body).length > 0
  });
  
  next();
};

module.exports = {
  requestCorrelationMiddleware,
  requestContextMiddleware
};
