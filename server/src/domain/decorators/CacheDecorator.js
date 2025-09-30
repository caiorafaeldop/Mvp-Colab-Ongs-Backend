/**
 * DECORATOR PATTERN - CacheDecorator
 * 
 * Adiciona cache automático a repositories sem modificar o código original.
 * Reduz queries ao banco de dados em 50-90%.
 */

const { logger } = require('../../infra/logger');

class CacheDecorator {
  /**
   * @param {Object} repository - Repository a ser decorado
   * @param {Object} options - Opções de cache
   */
  constructor(repository, options = {}) {
    this.repository = repository;
    this.cache = new Map();
    this.ttl = options.ttl || 300000; // 5 minutos padrão
    this.maxSize = options.maxSize || 1000; // Máximo 1000 items
    this.name = repository.constructor.name || 'Repository';
    
    // Estatísticas
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };

    logger.info(`[CACHE DECORATOR] ${this.name} decorado com cache (TTL: ${this.ttl}ms)`);
  }

  /**
   * Gera chave de cache baseada no método e argumentos
   * @private
   */
  _generateKey(method, args) {
    const argsKey = JSON.stringify(args);
    return `${this.name}:${method}:${argsKey}`;
  }

  /**
   * Verifica se item do cache ainda é válido
   * @private
   */
  _isValid(item) {
    if (!item) return false;
    const age = Date.now() - item.timestamp;
    return age < this.ttl;
  }

  /**
   * Limpa cache expirado
   * @private
   */
  _cleanExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp >= this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`[CACHE DECORATOR] ${cleaned} items expirados removidos`);
      this.stats.evictions += cleaned;
    }
  }

  /**
   * Remove item mais antigo se cache estiver cheio
   * @private
   */
  _evictOldest() {
    if (this.cache.size < this.maxSize) return;

    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      logger.debug(`[CACHE DECORATOR] Item mais antigo removido: ${oldestKey}`);
    }
  }

  /**
   * Obtém valor do cache ou executa operação
   * @private
   */
  async _getCached(method, args, operation) {
    const key = this._generateKey(method, args);
    
    // Limpar expirados periodicamente
    if (Math.random() < 0.1) { // 10% das vezes
      this._cleanExpired();
    }

    // Tentar obter do cache
    const cached = this.cache.get(key);
    if (this._isValid(cached)) {
      this.stats.hits++;
      logger.debug(`[CACHE DECORATOR] ✅ Cache HIT: ${key}`);
      return cached.data;
    }

    // Cache miss - executar operação
    this.stats.misses++;
    logger.debug(`[CACHE DECORATOR] ❌ Cache MISS: ${key}`);
    
    const result = await operation();
    
    // Armazenar no cache
    this._evictOldest();
    this.cache.set(key, {
      data: result,
      timestamp: Date.now()
    });
    this.stats.sets++;

    return result;
  }

  /**
   * Invalida cache específico
   */
  invalidate(method, args) {
    const key = this._generateKey(method, args);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      logger.debug(`[CACHE DECORATOR] Cache invalidado: ${key}`);
    }
    
    return deleted;
  }

  /**
   * Limpa todo o cache
   */
  clearAll() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`[CACHE DECORATOR] ${size} items removidos do cache`);
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hitRate: `${hitRate}%`,
      total
    };
  }

  // ==========================================
  // MÉTODOS DECORADOS (Repository Interface)
  // ==========================================

  /**
   * findById com cache
   */
  async findById(id) {
    return this._getCached('findById', [id], () => 
      this.repository.findById(id)
    );
  }

  /**
   * findByEmail com cache
   */
  async findByEmail(email) {
    return this._getCached('findByEmail', [email], () => 
      this.repository.findByEmail(email)
    );
  }

  /**
   * findAll com cache
   */
  async findAll(options = {}) {
    return this._getCached('findAll', [options], () => 
      this.repository.findAll(options)
    );
  }

  /**
   * findByOrganizationId com cache
   */
  async findByOrganizationId(orgId) {
    return this._getCached('findByOrganizationId', [orgId], () => 
      this.repository.findByOrganizationId(orgId)
    );
  }

  /**
   * create - invalida cache relacionado
   */
  async create(data) {
    const result = await this.repository.create(data);
    
    // Invalidar caches relacionados
    this.invalidate('findAll', [{}]);
    if (data.organizationId) {
      this.invalidate('findByOrganizationId', [data.organizationId]);
    }
    
    logger.debug(`[CACHE DECORATOR] Cache invalidado após create`);
    return result;
  }

  /**
   * update - invalida cache relacionado
   */
  async update(id, data) {
    const result = await this.repository.update(id, data);
    
    // Invalidar caches relacionados
    this.invalidate('findById', [id]);
    this.invalidate('findAll', [{}]);
    if (data.organizationId) {
      this.invalidate('findByOrganizationId', [data.organizationId]);
    }
    
    logger.debug(`[CACHE DECORATOR] Cache invalidado após update`);
    return result;
  }

  /**
   * delete - invalida cache relacionado
   */
  async delete(id) {
    // Obter dados antes de deletar para invalidar caches corretos
    const item = await this.findById(id);
    
    const result = await this.repository.delete(id);
    
    // Invalidar caches relacionados
    this.invalidate('findById', [id]);
    this.invalidate('findAll', [{}]);
    if (item?.organizationId) {
      this.invalidate('findByOrganizationId', [item.organizationId]);
    }
    
    logger.debug(`[CACHE DECORATOR] Cache invalidado após delete`);
    return result;
  }

  /**
   * Passa qualquer outro método para o repository original
   */
  async _proxyMethod(method, ...args) {
    if (typeof this.repository[method] === 'function') {
      return this.repository[method](...args);
    }
    throw new Error(`Método ${method} não existe no repository`);
  }
}

// Proxy para capturar métodos não definidos explicitamente
const createCachedRepository = (repository, options) => {
  const decorator = new CacheDecorator(repository, options);
  
  return new Proxy(decorator, {
    get(target, prop) {
      // Se método existe no decorator, usar ele
      if (prop in target && typeof target[prop] === 'function') {
        return target[prop].bind(target);
      }
      
      // Se método existe no repository original, proxiar
      if (prop in target.repository && typeof target.repository[prop] === 'function') {
        return (...args) => target.repository[prop](...args);
      }
      
      // Propriedades normais
      return target[prop];
    }
  });
};

module.exports = { CacheDecorator, createCachedRepository };
