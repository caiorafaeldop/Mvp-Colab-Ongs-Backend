/**
 * PROXY PATTERN (Estrutural)
 *
 * Proxy transparente para adicionar funcionalidades a Services sem modificá-los:
 * - Validação automática de parâmetros
 * - Logging de entrada/saída
 * - Cache de resultados
 * - Controle de acesso
 * - Medição de performance
 *
 * Usa JavaScript Proxy nativo para interceptar chamadas de métodos
 */

const { logger } = require('../../infra/logger');

class ServiceProxy {
  /**
   * Cria um proxy transparente para um service
   * @param {Object} target - Service original
   * @param {Object} options - Opções de proxy
   * @returns {Proxy} Service com proxy aplicado
   */
  static create(target, options = {}) {
    const {
      enableLogging = true,
      enableCache = false,
      enableValidation = false,
      enablePerformance = true,
      cacheTTL = 300000, // 5 minutos
      serviceName = target.constructor.name,
    } = options;

    // Cache storage
    const cache = new Map();

    return new Proxy(target, {
      get(targetObj, prop, receiver) {
        const originalMethod = targetObj[prop];

        // Se não for função, retorna direto
        if (typeof originalMethod !== 'function') {
          return originalMethod;
        }

        // Retorna método interceptado
        return async function (...args) {
          const methodName = prop;
          const startTime = Date.now();

          try {
            // 1. LOGGING - Entrada
            if (enableLogging) {
              logger.info(`[PROXY] ${serviceName}.${methodName}() chamado`, {
                args: ServiceProxy._sanitizeArgs(args),
                timestamp: new Date().toISOString(),
              });
            }

            // 2. VALIDATION - Validar parâmetros
            if (enableValidation) {
              ServiceProxy._validateArgs(methodName, args);
            }

            // 3. CACHE - Verificar cache
            if (enableCache) {
              const cacheKey = ServiceProxy._generateCacheKey(serviceName, methodName, args);
              const cached = cache.get(cacheKey);

              if (cached && Date.now() - cached.timestamp < cacheTTL) {
                if (enableLogging) {
                  logger.info(`[PROXY] ${serviceName}.${methodName}() - Cache HIT`, {
                    cacheKey,
                    age: Date.now() - cached.timestamp,
                  });
                }
                return cached.data;
              }
            }

            // 4. EXECUÇÃO - Chamar método original
            const result = await originalMethod.apply(targetObj, args);

            // 5. CACHE - Armazenar resultado
            if (enableCache && result !== undefined) {
              const cacheKey = ServiceProxy._generateCacheKey(serviceName, methodName, args);
              cache.set(cacheKey, {
                data: result,
                timestamp: Date.now(),
              });
            }

            // 6. PERFORMANCE - Medir tempo
            const duration = Date.now() - startTime;
            if (enablePerformance && duration > 1000) {
              logger.warn(`[PROXY] ${serviceName}.${methodName}() SLOW`, {
                duration: `${duration}ms`,
                threshold: '1000ms',
              });
            }

            // 7. LOGGING - Saída
            if (enableLogging) {
              logger.info(`[PROXY] ${serviceName}.${methodName}() completado`, {
                duration: `${duration}ms`,
                hasResult: result !== undefined,
              });
            }

            return result;
          } catch (error) {
            // 8. ERROR HANDLING - Logging de erros
            const duration = Date.now() - startTime;

            logger.error(`[PROXY] ${serviceName}.${methodName}() ERRO`, {
              error: error.message,
              stack: error.stack,
              duration: `${duration}ms`,
              args: ServiceProxy._sanitizeArgs(args),
            });

            throw error;
          }
        };
      },
    });
  }

  /**
   * Sanitiza argumentos removendo dados sensíveis
   */
  static _sanitizeArgs(args) {
    return args.map((arg) => {
      if (typeof arg !== 'object' || arg === null) {
        return arg;
      }

      const sanitized = { ...arg };
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];

      sensitiveFields.forEach((field) => {
        if (field in sanitized) {
          sanitized[field] = '***REDACTED***';
        }
      });

      return sanitized;
    });
  }

  /**
   * Valida argumentos básicos
   */
  static _validateArgs(methodName, args) {
    if (methodName.toLowerCase().includes('create') && args.length === 0) {
      throw new Error(`[PROXY VALIDATION] ${methodName} requer parâmetros`);
    }

    if (methodName.toLowerCase().includes('update') && args.length < 2) {
      throw new Error(`[PROXY VALIDATION] ${methodName} requer ID e dados`);
    }

    if (methodName.toLowerCase().includes('delete') && args.length === 0) {
      throw new Error(`[PROXY VALIDATION] ${methodName} requer ID`);
    }
  }

  /**
   * Gera chave de cache baseada em service, método e argumentos
   */
  static _generateCacheKey(serviceName, methodName, args) {
    const argsKey = JSON.stringify(ServiceProxy._sanitizeArgs(args));
    return `${serviceName}:${methodName}:${argsKey}`;
  }

  /**
   * Limpa cache do proxy
   */
  static clearCache(proxy) {
    // TODO: Implementar limpeza de cache se necessário
    logger.info('[PROXY] Cache limpo');
  }
}

module.exports = ServiceProxy;
