/**
 * PROXY PATTERN para Repositories
 * 
 * Proxy especializado para repositories com:
 * - Cache inteligente de queries
 * - Logging de operações DB
 * - Validação de IDs
 * - Medição de performance de queries
 */

const { logger } = require('../../infra/logger');

class RepositoryProxy {
  /**
   * Cria proxy para repository
   * @param {Object} repository - Repository original
   * @param {Object} options - Opções
   * @returns {Proxy} Repository com proxy
   */
  static create(repository, options = {}) {
    const {
      enableCache = true,
      cacheTTL = 600000, // 10 minutos
      enableLogging = true,
      repositoryName = repository.constructor.name
    } = options;

    const cache = new Map();
    const stats = {
      hits: 0,
      misses: 0,
      queries: 0,
      totalTime: 0
    };

    return new Proxy(repository, {
      get(target, prop) {
        const originalMethod = target[prop];

        if (typeof originalMethod !== 'function') {
          return originalMethod;
        }

        return async function (...args) {
          const startTime = Date.now();
          stats.queries++;

          try {
            // CACHE para métodos de leitura
            const isReadOperation = ['find', 'get', 'list', 'search'].some(
              op => prop.toLowerCase().includes(op)
            );

            if (enableCache && isReadOperation) {
              const cacheKey = RepositoryProxy._generateCacheKey(repositoryName, prop, args);
              const cached = cache.get(cacheKey);

              if (cached && Date.now() - cached.timestamp < cacheTTL) {
                stats.hits++;
                
                if (enableLogging) {
                  logger.debug(`[REPO PROXY] ${repositoryName}.${prop}() - Cache HIT`, {
                    cacheKey: cacheKey.substring(0, 50),
                    hitRate: `${((stats.hits / stats.queries) * 100).toFixed(1)}%`
                  });
                }
                
                return cached.data;
              }

              stats.misses++;
            }

            // VALIDAÇÃO de IDs
            if (prop === 'findById' || prop === 'update' || prop === 'delete') {
              RepositoryProxy._validateId(args[0]);
            }

            // EXECUÇÃO
            const result = await originalMethod.apply(target, args);

            // ARMAZENAR em cache
            if (enableCache && isReadOperation && result !== undefined) {
              const cacheKey = RepositoryProxy._generateCacheKey(repositoryName, prop, args);
              cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
              });
            }

            // INVALIDAR cache em operações de escrita
            if (!isReadOperation) {
              RepositoryProxy._invalidateCache(cache, repositoryName);
            }

            // LOGGING e PERFORMANCE
            const duration = Date.now() - startTime;
            stats.totalTime += duration;

            if (enableLogging) {
              const avgTime = stats.totalTime / stats.queries;
              
              logger.info(`[REPO PROXY] ${repositoryName}.${prop}()`, {
                duration: `${duration}ms`,
                avgQueryTime: `${avgTime.toFixed(0)}ms`,
                cached: isReadOperation,
                hitRate: `${((stats.hits / stats.queries) * 100).toFixed(1)}%`
              });
            }

            if (duration > 2000) {
              logger.warn(`[REPO PROXY] SLOW QUERY: ${repositoryName}.${prop}()`, {
                duration: `${duration}ms`,
                args: args.length > 0 ? 'present' : 'none'
              });
            }

            return result;

          } catch (error) {
            logger.error(`[REPO PROXY] ${repositoryName}.${prop}() ERRO`, {
              error: error.message,
              duration: `${Date.now() - startTime}ms`
            });
            throw error;
          }
        };
      }
    });
  }

  /**
   * Valida ID do MongoDB
   */
  static _validateId(id) {
    if (!id) {
      throw new Error('[REPO PROXY] ID é obrigatório');
    }

    // Validação básica de ObjectId do MongoDB (24 caracteres hex)
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      return true;
    }

    // Aceita objetos que podem ter _id
    if (typeof id === 'object') {
      return true;
    }

    logger.warn('[REPO PROXY] ID pode ser inválido', { id });
  }

  /**
   * Gera chave de cache
   */
  static _generateCacheKey(repositoryName, methodName, args) {
    const argsKey = JSON.stringify(args);
    return `${repositoryName}:${methodName}:${argsKey}`;
  }

  /**
   * Invalida cache após operações de escrita
   */
  static _invalidateCache(cache, repositoryName) {
    let cleared = 0;
    for (const key of cache.keys()) {
      if (key.startsWith(repositoryName)) {
        cache.delete(key);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      logger.debug(`[REPO PROXY] Cache invalidado: ${cleared} entradas`, {
        repository: repositoryName
      });
    }
  }
}

module.exports = RepositoryProxy;
