const IDecorator = require('../../domain/decorators/IDecorator');

/**
 * Decorator para cache automático
 * Adiciona cache de resultados para qualquer componente
 */
class CachingDecorator extends IDecorator {
  constructor(component, cacheProvider, options = {}) {
    super(component);
    this.cache = cacheProvider || new Map(); // Fallback para Map simples
    this.options = {
      ttl: 300000, // 5 minutos
      keyPrefix: component.constructor.name,
      cacheableResults: true,
      cacheableErrors: false,
      ...options
    };
  }

  /**
   * Executa operação com cache
   * @param {string} methodName - Nome do método
   * @param {...any} args - Argumentos
   * @returns {Promise<any>} Resultado (do cache ou original)
   */
  async execute(methodName, ...args) {
    const cacheKey = this.generateCacheKey(methodName, args);
    
    try {
      // Verifica cache primeiro
      const cachedResult = await this.getFromCache(cacheKey);
      if (cachedResult !== null) {
        console.log(`[CachingDecorator] Cache hit: ${cacheKey}`);
        return cachedResult;
      }

      // Executa método original
      console.log(`[CachingDecorator] Cache miss: ${cacheKey}`);
      const result = await this.component[methodName](...args);
      
      // Armazena no cache se configurado
      if (this.options.cacheableResults) {
        await this.setInCache(cacheKey, result);
      }

      return result;

    } catch (error) {
      // Armazena erro no cache se configurado
      if (this.options.cacheableErrors) {
        await this.setInCache(cacheKey, { error: error.message, isError: true });
      }
      throw error;
    }
  }

  /**
   * Gera chave de cache baseada no método e argumentos
   */
  generateCacheKey(methodName, args) {
    const argsHash = this.hashArgs(args);
    return `${this.options.keyPrefix}:${methodName}:${argsHash}`;
  }

  /**
   * Gera hash dos argumentos
   */
  hashArgs(args) {
    const serialized = JSON.stringify(args, (key, value) => {
      // Remove dados sensíveis do hash
      if (key === 'password' || key === 'token' || key === 'secret') {
        return '[REDACTED]';
      }
      return value;
    });
    
    // Hash simples (em produção, usar crypto.createHash)
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Obtém valor do cache
   */
  async getFromCache(key) {
    try {
      if (this.cache instanceof Map) {
        const cached = this.cache.get(key);
        if (cached && this.isValidCacheEntry(cached)) {
          return cached.isError ? null : cached.value;
        }
        return null;
      }

      // Para cache externo (Redis, etc.)
      if (this.cache.get) {
        const cached = await this.cache.get(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (this.isValidCacheEntry(parsed)) {
            return parsed.isError ? null : parsed.value;
          }
        }
      }

      return null;
    } catch (error) {
      console.warn(`[CachingDecorator] Cache read error: ${error.message}`);
      return null;
    }
  }

  /**
   * Armazena valor no cache
   */
  async setInCache(key, value) {
    try {
      const cacheEntry = {
        value: value,
        timestamp: Date.now(),
        ttl: this.options.ttl,
        isError: value && value.isError === true
      };

      if (this.cache instanceof Map) {
        this.cache.set(key, cacheEntry);
        
        // Remove entrada após TTL
        setTimeout(() => {
          this.cache.delete(key);
        }, this.options.ttl);
        
        return;
      }

      // Para cache externo
      if (this.cache.set) {
        await this.cache.set(key, JSON.stringify(cacheEntry), 'PX', this.options.ttl);
      }

    } catch (error) {
      console.warn(`[CachingDecorator] Cache write error: ${error.message}`);
    }
  }

  /**
   * Verifica se entrada do cache é válida
   */
  isValidCacheEntry(entry) {
    if (!entry || !entry.timestamp) return false;
    
    const age = Date.now() - entry.timestamp;
    return age < (entry.ttl || this.options.ttl);
  }

  /**
   * Limpa cache por padrão
   */
  async clearCache(pattern = null) {
    try {
      if (this.cache instanceof Map) {
        if (pattern) {
          for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
              this.cache.delete(key);
            }
          }
        } else {
          this.cache.clear();
        }
        return;
      }

      // Para cache externo
      if (this.cache.del && pattern) {
        const keys = await this.cache.keys(`*${pattern}*`);
        if (keys.length > 0) {
          await this.cache.del(keys);
        }
      }

    } catch (error) {
      console.warn(`[CachingDecorator] Cache clear error: ${error.message}`);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    if (this.cache instanceof Map) {
      return {
        size: this.cache.size,
        type: 'memory',
        ttl: this.options.ttl
      };
    }

    return {
      size: 'unknown',
      type: 'external',
      ttl: this.options.ttl
    };
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

module.exports = CachingDecorator;
