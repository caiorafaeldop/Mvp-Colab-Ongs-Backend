const { logger } = require('../../infra/logger');

/**
 * CHAIN OF RESPONSIBILITY - Contrato base para middlewares
 * Define interface comum para todos os middlewares da cadeia
 */

/**
 * Classe base abstrata para middlewares
 * Padroniza comportamento e logging na cadeia de responsabilidade
 */
class BaseMiddleware {
  constructor(name) {
    this.name = name;
  }

  /**
   * Método principal que deve ser implementado por middlewares concretos
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   * @param {Function} next - Função next do Express
   */
  async handle(req, res, next) {
    throw new Error(`Method handle must be implemented by ${this.constructor.name}`);
  }

  /**
   * Wrapper que adiciona logging e tratamento de erro padrão
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   * @param {Function} next - Função next do Express
   */
  async execute(req, res, next) {
    const requestLogger = req.logger || logger;
    const startTime = Date.now();

    try {
      requestLogger.debug(`Middleware ${this.name} iniciado`, {
        middleware: this.name,
        path: req.path,
        method: req.method,
      });

      await this.handle(req, res, next);

      const duration = Date.now() - startTime;
      requestLogger.debug(`Middleware ${this.name} concluído`, {
        middleware: this.name,
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      requestLogger.error(`Middleware ${this.name} falhou`, {
        middleware: this.name,
        error: error.message,
        duration: `${duration}ms`,
        stack: error.stack,
      });

      // Chamar próximo middleware com erro
      next(error);
    }
  }

  /**
   * Cria função middleware compatível com Express
   * @returns {Function} Middleware do Express
   */
  toExpressMiddleware() {
    return (req, res, next) => this.execute(req, res, next);
  }

  /**
   * Método utilitário para criar resposta de erro padronizada
   * @param {Object} res - Response do Express
   * @param {number} statusCode - Código HTTP
   * @param {string} message - Mensagem de erro
   * @param {string} errorCode - Código de erro específico
   * @param {Object} details - Detalhes adicionais
   */
  sendError(res, statusCode, message, errorCode = null, details = null) {
    const errorResponse = {
      success: false,
      message,
      error: errorCode || 'MIDDLEWARE_ERROR',
      timestamp: new Date().toISOString(),
    };

    if (details) {
      errorResponse.details = details;
    }

    if (res.headersSent) {
      return; // Headers já enviados, não pode responder
    }

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Método utilitário para validar se request pode prosseguir
   * @param {Object} req - Request do Express
   * @returns {boolean} True se pode prosseguir
   */
  canProceed(req) {
    return !req.middlewareError && !req.skipRemaining;
  }

  /**
   * Marca request para pular middlewares restantes
   * @param {Object} req - Request do Express
   * @param {string} reason - Motivo para pular
   */
  skipRemaining(req, reason = 'middleware_decision') {
    req.skipRemaining = true;
    req.skipReason = reason;

    const requestLogger = req.logger || logger;
    requestLogger.debug(`Middlewares restantes pulados por ${this.name}`, {
      middleware: this.name,
      reason,
    });
  }
}

/**
 * Factory para criar middlewares baseados na classe base
 */
class MiddlewareFactory {
  /**
   * Cria middleware de validação com contrato padronizado
   * @param {string} name - Nome do middleware
   * @param {Function} validator - Função de validação
   * @returns {BaseMiddleware} Instância do middleware
   */
  static createValidator(name, validator) {
    return new (class extends BaseMiddleware {
      constructor() {
        super(name);
        this.validator = validator;
      }

      async handle(req, res, next) {
        if (!this.canProceed(req)) {
          return next();
        }

        try {
          const result = await this.validator(req, res);
          if (result === false) {
            this.sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR');
            return;
          }
          next();
        } catch (error) {
          this.sendError(res, 400, error.message, 'VALIDATION_ERROR');
        }
      }
    })();
  }

  /**
   * Cria middleware de autorização com contrato padronizado
   * @param {string} name - Nome do middleware
   * @param {Function} authorizer - Função de autorização
   * @returns {BaseMiddleware} Instância do middleware
   */
  static createAuthorizer(name, authorizer) {
    return new (class extends BaseMiddleware {
      constructor() {
        super(name);
        this.authorizer = authorizer;
      }

      async handle(req, res, next) {
        if (!this.canProceed(req)) {
          return next();
        }

        try {
          const authorized = await this.authorizer(req, res);
          if (!authorized) {
            this.sendError(res, 403, 'Access denied', 'AUTHORIZATION_ERROR');
            return;
          }
          next();
        } catch (error) {
          this.sendError(res, 401, error.message, 'AUTHENTICATION_ERROR');
        }
      }
    })();
  }
}

module.exports = {
  BaseMiddleware,
  MiddlewareFactory,
};
