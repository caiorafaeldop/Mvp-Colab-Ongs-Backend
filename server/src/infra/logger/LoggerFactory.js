const Logger = require('./Logger');

/**
 * Factory para criação de loggers
 * Implementa Factory Pattern para diferentes tipos de logger
 */
class LoggerFactory {
  /**
   * Cria logger padrão da aplicação
   * @returns {Logger} Instância do logger
   */
  static createApplicationLogger() {
    return Logger.getInstance();
  }

  /**
   * Cria logger específico para um módulo/contexto
   * @param {string} module - Nome do módulo
   * @param {Object} context - Contexto adicional
   * @returns {Object} Logger com contexto
   */
  static createModuleLogger(module, context = {}) {
    const logger = Logger.getInstance();
    
    return logger.child({
      module,
      ...context
    });
  }

  /**
   * Cria logger para requests HTTP
   * @param {Object} req - Request object
   * @returns {Object} Logger com contexto de request
   */
  static createRequestLogger(req) {
    const logger = Logger.getInstance();
    
    const requestContext = {
      module: 'HTTP',
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Adicionar informações do usuário se autenticado
    if (req.user) {
      requestContext.userId = req.user.id;
      requestContext.userEmail = req.user.email;
    }

    return logger.child(requestContext);
  }

  /**
   * Cria logger para Use Cases
   * @param {string} useCaseName - Nome do Use Case
   * @param {Object} context - Contexto adicional
   * @returns {Object} Logger com contexto de Use Case
   */
  static createUseCaseLogger(useCaseName, context = {}) {
    const logger = Logger.getInstance();
    
    return logger.child({
      module: 'UseCase',
      useCase: useCaseName,
      ...context
    });
  }

  /**
   * Cria logger para Services
   * @param {string} serviceName - Nome do Service
   * @param {Object} context - Contexto adicional
   * @returns {Object} Logger com contexto de Service
   */
  static createServiceLogger(serviceName, context = {}) {
    const logger = Logger.getInstance();
    
    return logger.child({
      module: 'Service',
      service: serviceName,
      ...context
    });
  }

  /**
   * Cria logger para Repositories
   * @param {string} repositoryName - Nome do Repository
   * @param {Object} context - Contexto adicional
   * @returns {Object} Logger com contexto de Repository
   */
  static createRepositoryLogger(repositoryName, context = {}) {
    const logger = Logger.getInstance();
    
    return logger.child({
      module: 'Repository',
      repository: repositoryName,
      ...context
    });
  }

  /**
   * Cria logger para Jobs/Workers
   * @param {string} jobName - Nome do Job
   * @param {Object} context - Contexto adicional
   * @returns {Object} Logger com contexto de Job
   */
  static createJobLogger(jobName, context = {}) {
    const logger = Logger.getInstance();
    
    return logger.child({
      module: 'Job',
      job: jobName,
      ...context
    });
  }

  /**
   * Cria logger para integrações externas
   * @param {string} integration - Nome da integração
   * @param {Object} context - Contexto adicional
   * @returns {Object} Logger com contexto de integração
   */
  static createIntegrationLogger(integration, context = {}) {
    const logger = Logger.getInstance();
    
    return logger.child({
      module: 'Integration',
      integration,
      ...context
    });
  }

  /**
   * Middleware para logging automático de requests
   * @returns {Function} Middleware do Express
   */
  static createRequestLoggingMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const logger = LoggerFactory.createRequestLogger(req);
      
      // Adicionar logger ao request para uso nos controllers
      req.logger = logger;
      
      // Log do início do request
      logger.info('Request iniciado', {
        body: req.method === 'GET' ? undefined : req.body,
        query: req.query,
        params: req.params
      });

      // Override do res.json para logar resposta
      const originalJson = res.json;
      res.json = function(body) {
        const executionTime = Date.now() - startTime;
        
        logger.info('Request finalizado', {
          statusCode: res.statusCode,
          executionTime: `${executionTime}ms`,
          responseSize: JSON.stringify(body).length
        });
        
        return originalJson.call(this, body);
      };

      // Log de erros
      res.on('error', (error) => {
        const executionTime = Date.now() - startTime;
        
        logger.error('Erro no request', {
          error: error.message,
          stack: error.stack,
          executionTime: `${executionTime}ms`
        });
      });

      next();
    };
  }

  /**
   * Retorna estatísticas de todos os loggers
   * @returns {Object} Estatísticas
   */
  static getStats() {
    const mainLogger = Logger.getInstance();
    
    return {
      mainLogger: mainLogger.getStats(),
      availableFactories: [
        'createApplicationLogger',
        'createModuleLogger', 
        'createRequestLogger',
        'createUseCaseLogger',
        'createServiceLogger',
        'createRepositoryLogger',
        'createJobLogger',
        'createIntegrationLogger'
      ]
    };
  }
}

module.exports = LoggerFactory;
