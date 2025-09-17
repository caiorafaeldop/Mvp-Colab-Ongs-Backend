const IDecorator = require('../../domain/decorators/IDecorator');

/**
 * Decorator para logging automático
 * Adiciona logs de entrada, saída e erros para qualquer componente
 */
class LoggingDecorator extends IDecorator {
  constructor(component, logger, options = {}) {
    super(component);
    this.logger = logger;
    this.options = {
      logLevel: 'info',
      logArgs: false,
      logResult: false,
      logDuration: true,
      ...options
    };
  }

  /**
   * Executa operação com logging
   * @param {string} methodName - Nome do método
   * @param {...any} args - Argumentos
   * @returns {Promise<any>} Resultado
   */
  async execute(methodName, ...args) {
    const startTime = Date.now();
    const componentName = this.component.constructor.name;
    
    try {
      // Log de entrada
      this.logMethodStart(componentName, methodName, args);

      // Executa método original
      const result = await this.component[methodName](...args);
      
      // Log de sucesso
      const duration = Date.now() - startTime;
      this.logMethodSuccess(componentName, methodName, result, duration);

      return result;

    } catch (error) {
      // Log de erro
      const duration = Date.now() - startTime;
      this.logMethodError(componentName, methodName, error, duration);
      throw error;
    }
  }

  /**
   * Log de início do método
   */
  logMethodStart(componentName, methodName, args) {
    const logData = {
      component: componentName,
      method: methodName,
      action: 'start'
    };

    if (this.options.logArgs) {
      logData.args = this.sanitizeArgs(args);
    }

    this.logger[this.options.logLevel](`[${componentName}] ${methodName} started`, logData);
  }

  /**
   * Log de sucesso do método
   */
  logMethodSuccess(componentName, methodName, result, duration) {
    const logData = {
      component: componentName,
      method: methodName,
      action: 'success'
    };

    if (this.options.logDuration) {
      logData.duration = `${duration}ms`;
    }

    if (this.options.logResult) {
      logData.result = this.sanitizeResult(result);
    }

    this.logger[this.options.logLevel](`[${componentName}] ${methodName} completed`, logData);
  }

  /**
   * Log de erro do método
   */
  logMethodError(componentName, methodName, error, duration) {
    const logData = {
      component: componentName,
      method: methodName,
      action: 'error',
      error: error.message,
      stack: error.stack
    };

    if (this.options.logDuration) {
      logData.duration = `${duration}ms`;
    }

    this.logger.error(`[${componentName}] ${methodName} failed`, logData);
  }

  /**
   * Sanitiza argumentos para log
   */
  sanitizeArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        // Remove dados sensíveis
        const sanitized = { ...arg };
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.secret;
        return sanitized;
      }
      return arg;
    });
  }

  /**
   * Sanitiza resultado para log
   */
  sanitizeResult(result) {
    if (typeof result === 'object' && result !== null) {
      const sanitized = { ...result };
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.secret;
      return sanitized;
    }
    return result;
  }

  /**
   * Cria proxy para interceptar todas as chamadas de método
   * @returns {Proxy} Proxy do componente
   */
  createProxy() {
    return new Proxy(this.component, {
      get: (target, prop) => {
        if (typeof target[prop] === 'function') {
          return async (...args) => {
            return await this.execute(prop, ...args);
          };
        }
        return target[prop];
      }
    });
  }
}

module.exports = LoggingDecorator;
