const IDecorator = require('../../domain/decorators/IDecorator');

/**
 * Decorator para rate limiting automático
 * Adiciona controle de taxa de execução para qualquer componente
 */
class RateLimitingDecorator extends IDecorator {
  constructor(component, options = {}) {
    super(component);
    this.options = {
      maxRequests: 100,
      windowMs: 60000, // 1 minuto
      keyGenerator: null, // Função para gerar chave única
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options
    };
    
    this.requests = new Map(); // Armazena contadores por chave
  }

  /**
   * Executa operação com rate limiting
   * @param {string} methodName - Nome do método
   * @param {...any} args - Argumentos
   * @returns {Promise<any>} Resultado ou erro de rate limit
   */
  async execute(methodName, ...args) {
    const key = this.generateKey(methodName, args);
    
    try {
      // Verifica rate limit
      if (!this.isAllowed(key)) {
        const error = new RateLimitError(`Rate limit exceeded for ${methodName}`);
        error.retryAfter = this.getRetryAfter(key);
        throw error;
      }

      // Executa método original
      const result = await this.component[methodName](...args);
      
      // Incrementa contador apenas se não deve pular sucessos
      if (!this.options.skipSuccessfulRequests) {
        this.incrementCounter(key);
      }

      return result;

    } catch (error) {
      // Incrementa contador apenas se não deve pular falhas
      if (!this.options.skipFailedRequests && !(error instanceof RateLimitError)) {
        this.incrementCounter(key);
      }
      throw error;
    }
  }

  /**
   * Gera chave para rate limiting
   */
  generateKey(methodName, args) {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(methodName, args);
    }

    // Chave padrão: componente + método
    return `${this.component.constructor.name}:${methodName}`;
  }

  /**
   * Verifica se requisição é permitida
   */
  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    
    // Limpa requisições antigas
    this.cleanOldRequests(key, windowStart);
    
    const requestCount = this.getRequestCount(key);
    return requestCount < this.options.maxRequests;
  }

  /**
   * Incrementa contador de requisições
   */
  incrementCounter(key) {
    const now = Date.now();
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    this.requests.get(key).push(now);
  }

  /**
   * Obtém contagem de requisições na janela atual
   */
  getRequestCount(key) {
    const requests = this.requests.get(key);
    return requests ? requests.length : 0;
  }

  /**
   * Remove requisições antigas da janela
   */
  cleanOldRequests(key, windowStart) {
    const requests = this.requests.get(key);
    if (!requests) return;

    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length === 0) {
      this.requests.delete(key);
    } else {
      this.requests.set(key, validRequests);
    }
  }

  /**
   * Calcula tempo para próxima tentativa
   */
  getRetryAfter(key) {
    const requests = this.requests.get(key);
    if (!requests || requests.length === 0) return 0;

    const oldestRequest = Math.min(...requests);
    const retryAfter = oldestRequest + this.options.windowMs - Date.now();
    
    return Math.max(0, Math.ceil(retryAfter / 1000)); // Em segundos
  }

  /**
   * Obtém estatísticas de rate limiting
   */
  getStats() {
    const stats = {
      totalKeys: this.requests.size,
      windowMs: this.options.windowMs,
      maxRequests: this.options.maxRequests,
      keys: {}
    };

    for (const [key, requests] of this.requests) {
      stats.keys[key] = {
        currentRequests: requests.length,
        remaining: Math.max(0, this.options.maxRequests - requests.length),
        resetTime: requests.length > 0 ? 
          new Date(Math.min(...requests) + this.options.windowMs) : 
          null
      };
    }

    return stats;
  }

  /**
   * Reseta contador para uma chave específica
   */
  resetKey(key) {
    this.requests.delete(key);
  }

  /**
   * Reseta todos os contadores
   */
  resetAll() {
    this.requests.clear();
  }

  /**
   * Cria proxy para interceptar todas as chamadas de método
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

/**
 * Classe de erro de rate limit
 */
class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
    this.retryAfter = 0;
  }
}

module.exports = { RateLimitingDecorator, RateLimitError };
