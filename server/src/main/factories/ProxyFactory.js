/**
 * Factory para criação de Proxies
 * Centraliza criação de proxies para services e repositories
 */

const ServiceProxy = require('../proxies/ServiceProxy');
const RepositoryProxy = require('../proxies/RepositoryProxy');
const { logger } = require('../../infra/logger');

class ProxyFactory {
  constructor() {
    this.proxiedObjects = new Map();
  }

  /**
   * Cria proxy para um service
   * @param {Object} service - Service original
   * @param {Object} options - Opções de proxy
   * @returns {Proxy} Service com proxy aplicado
   */
  createServiceProxy(service, options = {}) {
    const serviceName = service.constructor.name;

    if (this.proxiedObjects.has(serviceName)) {
      logger.debug(`[PROXY FACTORY] Reutilizando proxy: ${serviceName}`);
      return this.proxiedObjects.get(serviceName);
    }

    const defaultOptions = {
      enableLogging: process.env.NODE_ENV !== 'test',
      enableCache: false, // Cache desabilitado por padrão em services
      enableValidation: true,
      enablePerformance: true,
    };

    const proxy = ServiceProxy.create(service, { ...defaultOptions, ...options });
    this.proxiedObjects.set(serviceName, proxy);

    logger.info(`[PROXY FACTORY] Service proxy criado: ${serviceName}`);
    return proxy;
  }

  /**
   * Cria proxy para um repository
   * @param {Object} repository - Repository original
   * @param {Object} options - Opções de proxy
   * @returns {Proxy} Repository com proxy aplicado
   */
  createRepositoryProxy(repository, options = {}) {
    const repoName = repository.constructor.name;

    if (this.proxiedObjects.has(repoName)) {
      logger.debug(`[PROXY FACTORY] Reutilizando proxy: ${repoName}`);
      return this.proxiedObjects.get(repoName);
    }

    const defaultOptions = {
      enableCache: true, // Cache habilitado por padrão em repositories
      cacheTTL: 600000, // 10 minutos
      enableLogging: process.env.NODE_ENV !== 'test',
    };

    const proxy = RepositoryProxy.create(repository, { ...defaultOptions, ...options });
    this.proxiedObjects.set(repoName, proxy);

    logger.info(`[PROXY FACTORY] Repository proxy criado: ${repoName}`);
    return proxy;
  }

  /**
   * Aplica proxy automaticamente baseado no tipo
   * @param {Object} object - Objeto a ser proxied
   * @param {string} type - Tipo: 'service' ou 'repository'
   * @param {Object} options - Opções
   * @returns {Proxy} Objeto com proxy
   */
  applyProxy(object, type = 'service', options = {}) {
    if (type === 'service') {
      return this.createServiceProxy(object, options);
    } else if (type === 'repository') {
      return this.createRepositoryProxy(object, options);
    } else {
      logger.warn(`[PROXY FACTORY] Tipo desconhecido: ${type}`);
      return object;
    }
  }

  /**
   * Retorna estatísticas dos proxies criados
   */
  getStats() {
    return {
      totalProxies: this.proxiedObjects.size,
      proxiedObjects: Array.from(this.proxiedObjects.keys()),
    };
  }

  /**
   * Limpa todos os proxies (útil para testes)
   */
  clear() {
    this.proxiedObjects.clear();
    logger.info('[PROXY FACTORY] Todos os proxies limpos');
  }
}

module.exports = ProxyFactory;
