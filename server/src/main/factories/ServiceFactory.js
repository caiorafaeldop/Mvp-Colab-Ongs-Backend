const EnhancedJwtAuthService = require("../../infra/services/EnhancedJwtAuthService");
const ProductService = require("../../application/services/ProductService");

/**
 * Factory para criação de Services seguindo o Factory Pattern
 * Centraliza a criação e configuração de todos os services da aplicação
 */
class ServiceFactory {
  constructor() {
    this.services = new Map();
    this.dependencies = new Map();
  }

  /**
   * Registra dependências necessárias para os services
   * @param {Object} deps - Objeto com as dependências
   */
  registerDependencies(deps) {
    Object.entries(deps).forEach(([key, value]) => {
      this.dependencies.set(key, value);
    });
  }

  /**
   * Cria ou retorna instância existente do AuthService
   * Implementa Singleton pattern dentro do Factory
   * @returns {EnhancedJwtAuthService}
   */
  createAuthService() {
    if (!this.services.has('authService')) {
      console.log('[SERVICE FACTORY] Criando AuthService');
      
      const userRepository = this.dependencies.get('userRepository');
      if (!userRepository) {
        throw new Error('UserRepository dependency not found');
      }

      const jwtSecret = process.env.JWT_SECRET;
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

      if (!jwtSecret || !jwtRefreshSecret) {
        throw new Error('JWT secrets not configured in environment variables');
      }

      const authService = new EnhancedJwtAuthService(
        userRepository,
        jwtSecret,
        jwtRefreshSecret
      );

      this.services.set('authService', authService);
      console.log('[SERVICE FACTORY] AuthService criado com sucesso');
    }

    return this.services.get('authService');
  }

  /**
   * Cria ou retorna instância existente do ProductService
   * @returns {ProductService}
   */
  createProductService() {
    if (!this.services.has('productService')) {
      console.log('[SERVICE FACTORY] Criando ProductService');
      
      const productRepository = this.dependencies.get('productRepository');
      const userRepository = this.dependencies.get('userRepository');

      if (!productRepository || !userRepository) {
        throw new Error('ProductRepository or UserRepository dependency not found');
      }

      const productService = new ProductService(
        productRepository,
        userRepository
      );

      this.services.set('productService', productService);
      console.log('[SERVICE FACTORY] ProductService criado com sucesso');
    }

    return this.services.get('productService');
  }

  /**
   * Cria service por nome usando reflexão
   * @param {string} serviceName - Nome do service
   * @param {Array} dependencies - Array de dependências
   * @returns {Object} Instância do service
   */
  createService(serviceName, dependencies = []) {
    const serviceKey = serviceName.toLowerCase();
    
    if (this.services.has(serviceKey)) {
      return this.services.get(serviceKey);
    }

    console.log(`[SERVICE FACTORY] Criando service genérico: ${serviceName}`);

    // Mapeamento de services disponíveis
    const serviceMap = {
      'authservice': () => this.createAuthService(),
      'productservice': () => this.createProductService(),
    };

    const factory = serviceMap[serviceKey];
    if (!factory) {
      throw new Error(`Service factory not found for: ${serviceName}`);
    }

    const service = factory();
    this.services.set(serviceKey, service);
    
    return service;
  }

  /**
   * Retorna service existente sem criar novo
   * @param {string} serviceName - Nome do service
   * @returns {Object|null} Instância do service ou null
   */
  getService(serviceName) {
    return this.services.get(serviceName.toLowerCase()) || null;
  }

  /**
   * Lista todos os services criados
   * @returns {Array<string>} Lista de nomes dos services
   */
  getCreatedServices() {
    return Array.from(this.services.keys());
  }

  /**
   * Limpa cache de services (útil para testes)
   */
  clearServices() {
    console.log('[SERVICE FACTORY] Limpando cache de services');
    this.services.clear();
  }

  /**
   * Verifica se todas as dependências necessárias estão registradas
   * @param {Array<string>} requiredDeps - Lista de dependências obrigatórias
   * @returns {boolean} True se todas estão disponíveis
   */
  validateDependencies(requiredDeps) {
    return requiredDeps.every(dep => this.dependencies.has(dep));
  }

  /**
   * Retorna informações sobre o estado atual do factory
   * @returns {Object} Estado do factory
   */
  getFactoryState() {
    return {
      servicesCreated: this.getCreatedServices(),
      dependenciesRegistered: Array.from(this.dependencies.keys()),
      totalServices: this.services.size,
      totalDependencies: this.dependencies.size
    };
  }
}

module.exports = ServiceFactory;
