/**
 * DecoratorFactory - Factory para criar decorators
 * 
 * Centraliza criação de decorators e fornece configurações padrão.
 */

const { CacheDecorator, createCachedRepository } = require('../../domain/decorators/CacheDecorator');
const { RetryDecorator, createRetryService } = require('../../domain/decorators/RetryDecorator');
const { logger } = require('../../infra/logger');

class DecoratorFactory {
  /**
   * Cria repository com cache
   * @param {Object} repository - Repository a ser decorado
   * @param {Object} options - Opções customizadas
   * @returns {Proxy} Repository decorado com cache
   */
  static createCachedRepository(repository, options = {}) {
    const defaultOptions = {
      ttl: 300000, // 5 minutos
      maxSize: 1000,
      ...options
    };

    logger.info(`[DECORATOR FACTORY] Criando cached repository: ${repository.constructor.name}`);
    return createCachedRepository(repository, defaultOptions);
  }

  /**
   * Cria service com retry
   * @param {Object} service - Service a ser decorado
   * @param {Object} options - Opções customizadas
   * @returns {Proxy} Service decorado com retry
   */
  static createRetryService(service, options = {}) {
    const defaultOptions = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      ...options
    };

    logger.info(`[DECORATOR FACTORY] Criando retry service: ${service.constructor.name}`);
    return createRetryService(service, defaultOptions);
  }

  /**
   * Configurações pré-definidas por tipo de componente
   */
  static getDefaultConfig(type) {
    const configs = {
      // Repositories: cache agressivo
      userRepository: {
        cache: { ttl: 600000, maxSize: 500 } // 10 minutos, 500 users
      },
      productRepository: {
        cache: { ttl: 300000, maxSize: 1000 } // 5 minutos, 1000 products
      },
      donationRepository: {
        cache: { ttl: 60000, maxSize: 500 } // 1 minuto, 500 donations (dados mais dinâmicos)
      },
      organizationRepository: {
        cache: { ttl: 600000, maxSize: 200 } // 10 minutos, 200 orgs
      },

      // Services externos: retry agressivo
      mercadoPagoService: {
        retry: { maxRetries: 5, retryDelay: 2000, backoffMultiplier: 2 }
      },
      cloudinaryService: {
        retry: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 1.5 }
      },
      emailService: {
        retry: { maxRetries: 3, retryDelay: 5000, backoffMultiplier: 2 }
      }
    };

    return configs[type] || {};
  }

  /**
   * Decora repository com configuração padrão
   * @param {Object} repository - Repository
   * @param {string} type - Tipo do repository (ex: 'userRepository')
   * @returns {Proxy} Repository decorado
   */
  static decorateRepository(repository, type = 'default') {
    const config = this.getDefaultConfig(type);
    
    if (config.cache) {
      return this.createCachedRepository(repository, config.cache);
    }

    // Fallback: cache padrão
    return this.createCachedRepository(repository);
  }

  /**
   * Decora service com configuração padrão
   * @param {Object} service - Service
   * @param {string} type - Tipo do service (ex: 'mercadoPagoService')
   * @returns {Proxy} Service decorado
   */
  static decorateService(service, type = 'default') {
    const config = this.getDefaultConfig(type);
    
    if (config.retry) {
      return this.createRetryService(service, config.retry);
    }

    // Fallback: retry padrão
    return this.createRetryService(service);
  }

  /**
   * Obtém estatísticas de um componente decorado
   * @param {Object} decoratedComponent - Componente decorado
   * @returns {Object} Estatísticas
   */
  static getStats(decoratedComponent) {
    if (decoratedComponent.getStats && typeof decoratedComponent.getStats === 'function') {
      return decoratedComponent.getStats();
    }
    return null;
  }

  /**
   * Limpa cache de um repository decorado
   * @param {Object} decoratedRepository - Repository decorado
   */
  static clearCache(decoratedRepository) {
    if (decoratedRepository.clearAll && typeof decoratedRepository.clearAll === 'function') {
      decoratedRepository.clearAll();
      logger.info('[DECORATOR FACTORY] Cache limpo');
    }
  }

  /**
   * Invalida cache específico
   * @param {Object} decoratedRepository - Repository decorado
   * @param {string} method - Método
   * @param {Array} args - Argumentos
   */
  static invalidateCache(decoratedRepository, method, args) {
    if (decoratedRepository.invalidate && typeof decoratedRepository.invalidate === 'function') {
      decoratedRepository.invalidate(method, args);
      logger.debug(`[DECORATOR FACTORY] Cache invalidado: ${method}`);
    }
  }
}

module.exports = DecoratorFactory;
