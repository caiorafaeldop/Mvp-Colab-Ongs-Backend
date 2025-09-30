/**
 * DECORATOR PATTERN - RetryDecorator
 * 
 * Adiciona retry automático a serviços sem modificar o código original.
 * Perfeito para Mercado Pago e outras APIs externas que podem falhar temporariamente.
 */

const { logger } = require('../../infra/logger');

class RetryDecorator {
  /**
   * @param {Object} service - Serviço a ser decorado
   * @param {Object} options - Opções de retry
   */
  constructor(service, options = {}) {
    this.service = service;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 segundo
    this.backoffMultiplier = options.backoffMultiplier || 2; // Exponential backoff
    this.retryableErrors = options.retryableErrors || [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'Network',
      '5', // Status codes 5xx
      'timeout'
    ];
    this.name = service.constructor.name || 'Service';

    // Estatísticas
    this.stats = {
      totalCalls: 0,
      successOnFirstTry: 0,
      successAfterRetry: 0,
      totalFailures: 0,
      retriesByMethod: {}
    };

    logger.info(`[RETRY DECORATOR] ${this.name} decorado com retry (max: ${this.maxRetries})`);
  }

  /**
   * Verifica se o erro é retryable
   * @private
   */
  _isRetryableError(error) {
    if (!error) return false;

    const errorString = error.toString();
    const errorCode = error.code || '';
    const statusCode = error.statusCode || error.status || 0;

    // Verificar código de status HTTP
    if (statusCode >= 500 && statusCode < 600) {
      return true;
    }

    // Verificar códigos de erro específicos
    for (const retryable of this.retryableErrors) {
      if (errorCode.includes(retryable) || errorString.includes(retryable)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calcula delay com exponential backoff
   * @private
   */
  _calculateDelay(attempt) {
    const baseDelay = this.retryDelay;
    const delay = baseDelay * Math.pow(this.backoffMultiplier, attempt - 1);
    
    // Adicionar jitter (variação aleatória de ±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    
    return Math.floor(delay + jitter);
  }

  /**
   * Aguarda por um período de tempo
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Executa operação com retry
   * @private
   */
  async _executeWithRetry(method, args, operation) {
    this.stats.totalCalls++;
    
    // Inicializar estatísticas do método se não existir
    if (!this.stats.retriesByMethod[method]) {
      this.stats.retriesByMethod[method] = {
        calls: 0,
        retries: 0,
        failures: 0
      };
    }
    this.stats.retriesByMethod[method].calls++;

    let lastError;
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        const result = await operation();
        
        // Sucesso!
        if (attempt === 0) {
          this.stats.successOnFirstTry++;
          logger.debug(`[RETRY DECORATOR] ✅ ${method} sucesso na primeira tentativa`);
        } else {
          this.stats.successAfterRetry++;
          this.stats.retriesByMethod[method].retries += attempt;
          logger.info(`[RETRY DECORATOR] ✅ ${method} sucesso após ${attempt} tentativas`);
        }
        
        return result;

      } catch (error) {
        lastError = error;
        attempt++;

        // Se não for retryable ou excedeu max retries
        if (!this._isRetryableError(error) || attempt > this.maxRetries) {
          this.stats.totalFailures++;
          this.stats.retriesByMethod[method].failures++;
          
          logger.error(`[RETRY DECORATOR] ❌ ${method} falhou após ${attempt - 1} tentativas`, {
            error: error.message,
            retryable: this._isRetryableError(error)
          });
          
          throw error;
        }

        // Calcular delay e aguardar
        const delay = this._calculateDelay(attempt);
        
        logger.warn(`[RETRY DECORATOR] ⚠️  ${method} falhou (tentativa ${attempt}/${this.maxRetries}), tentando novamente em ${delay}ms`, {
          error: error.message,
          errorCode: error.code,
          statusCode: error.statusCode || error.status
        });

        await this._sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Retorna estatísticas de retry
   */
  getStats() {
    const successRate = this.stats.totalCalls > 0 
      ? (((this.stats.successOnFirstTry + this.stats.successAfterRetry) / this.stats.totalCalls) * 100).toFixed(2)
      : 0;

    const retryRate = this.stats.totalCalls > 0
      ? ((this.stats.successAfterRetry / this.stats.totalCalls) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      successRate: `${successRate}%`,
      retryRate: `${retryRate}%`
    };
  }

  // ==========================================
  // MÉTODOS DECORADOS (Mercado Pago Service)
  // ==========================================

  /**
   * createPayment com retry
   */
  async createPayment(...args) {
    return this._executeWithRetry('createPayment', args, () =>
      this.service.createPayment(...args)
    );
  }

  /**
   * createSubscription com retry
   */
  async createSubscription(...args) {
    return this._executeWithRetry('createSubscription', args, () =>
      this.service.createSubscription(...args)
    );
  }

  /**
   * getPaymentStatus com retry
   */
  async getPaymentStatus(...args) {
    return this._executeWithRetry('getPaymentStatus', args, () =>
      this.service.getPaymentStatus(...args)
    );
  }

  /**
   * cancelSubscription com retry
   */
  async cancelSubscription(...args) {
    return this._executeWithRetry('cancelSubscription', args, () =>
      this.service.cancelSubscription(...args)
    );
  }

  /**
   * updateSubscription com retry
   */
  async updateSubscription(...args) {
    return this._executeWithRetry('updateSubscription', args, () =>
      this.service.updateSubscription(...args)
    );
  }

  /**
   * refundPayment com retry
   */
  async refundPayment(...args) {
    return this._executeWithRetry('refundPayment', args, () =>
      this.service.refundPayment(...args)
    );
  }
}

// Proxy para capturar métodos não definidos explicitamente
const createRetryService = (service, options) => {
  const decorator = new RetryDecorator(service, options);

  return new Proxy(decorator, {
    get(target, prop) {
      // Se método existe no decorator, usar ele
      if (prop in target && typeof target[prop] === 'function') {
        return target[prop].bind(target);
      }

      // Se método existe no service original e é função, criar retry wrapper
      if (prop in target.service && typeof target.service[prop] === 'function') {
        return (...args) => {
          // Métodos que NÃO devem ter retry (apenas leitura, sem efeitos colaterais)
          const noRetryMethods = ['getConfig', 'getStats', 'validateWebhook'];
          
          if (noRetryMethods.includes(prop)) {
            return target.service[prop](...args);
          }

          // Aplicar retry para outros métodos
          return target._executeWithRetry(prop, args, () => 
            target.service[prop](...args)
          );
        };
      }

      // Propriedades normais
      return target[prop];
    }
  });
};

module.exports = { RetryDecorator, createRetryService };
