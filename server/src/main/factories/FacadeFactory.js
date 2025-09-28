const ProductFacade = require('../../infra/facades/ProductFacade');
const AuthFacade = require('../../infra/facades/AuthFacade');
const UploadFacade = require('../../infra/facades/UploadFacade');

/**
 * Factory para criação e configuração de facades
 * Centraliza a criação de todos os facades do sistema
 */
class FacadeFactory {
  constructor() {
    this.facades = new Map();
  }

  /**
   * Inicializa todos os facades do sistema
   * @param {Object} dependencies - Dependências necessárias
   * @returns {Object} Facades configurados
   */
  static async initialize(dependencies = {}) {
    const factory = new FacadeFactory();
    return await factory.setupFacades(dependencies);
  }

  /**
   * Configura todos os facades do sistema
   * @param {Object} dependencies - Dependências necessárias
   * @returns {Object} Facades configurados
   */
  async setupFacades(dependencies) {
    try {
      console.log('[FacadeFactory] Configurando facades do sistema...');

      // Cria facades
      await this.createProductFacade(dependencies);
      await this.createAuthFacade(dependencies);
      await this.createUploadFacade(dependencies);

      console.log(`[FacadeFactory] ${this.facades.size} facades criados com sucesso`);

      return {
        productFacade: this.facades.get('product'),
        authFacade: this.facades.get('auth'),
        uploadFacade: this.facades.get('upload')
      };
    } catch (error) {
      console.error('[FacadeFactory] Erro ao configurar facades:', error.message);
      throw error;
    }
  }

  /**
   * Cria ProductFacade
   * @param {Object} dependencies - Dependências necessárias
   */
  async createProductFacade(dependencies) {
    try {
      const {
        productService,
        userRepository,
        storageAdapter,
        eventManager,
        recommendationStrategy,
        paymentStrategy
      } = dependencies;

      if (!productService) {
        console.warn('[FacadeFactory] ProductService não fornecido para ProductFacade');
      }

      const facade = new ProductFacade(
        productService,
        userRepository,
        storageAdapter,
        eventManager,
        recommendationStrategy,
        paymentStrategy
      );

      this.facades.set('product', facade);
      console.log('[FacadeFactory] ProductFacade criado');
    } catch (error) {
      console.error('[FacadeFactory] Erro ao criar ProductFacade:', error.message);
    }
  }

  /**
   * Cria AuthFacade
   * @param {Object} dependencies - Dependências necessárias
   */
  async createAuthFacade(dependencies) {
    try {
      const { authService, userRepository, eventManager } = dependencies;

      if (!authService) {
        console.warn('[FacadeFactory] AuthService não fornecido para AuthFacade');
      }

      const facade = new AuthFacade(authService, userRepository, eventManager);

      this.facades.set('auth', facade);
      console.log('[FacadeFactory] AuthFacade criado');
    } catch (error) {
      console.error('[FacadeFactory] Erro ao criar AuthFacade:', error.message);
    }
  }

  /**
   * Cria UploadFacade
   * @param {Object} dependencies - Dependências necessárias
   */
  async createUploadFacade(dependencies) {
    try {
      const { storageAdapter, fileRepository, eventManager } = dependencies;

      if (!storageAdapter) {
        console.warn('[FacadeFactory] StorageAdapter não fornecido para UploadFacade');
      }

      const facade = new UploadFacade(storageAdapter, fileRepository, eventManager);

      this.facades.set('upload', facade);
      console.log('[FacadeFactory] UploadFacade criado');
    } catch (error) {
      console.error('[FacadeFactory] Erro ao criar UploadFacade:', error.message);
    }
  }

  /**
   * Obtém facade por nome
   * @param {string} name - Nome do facade
   * @returns {Object|null} Facade encontrado
   */
  getFacade(name) {
    return this.facades.get(name) || null;
  }

  /**
   * Lista todos os facades
   * @returns {Array<Object>} Lista de facades
   */
  listFacades() {
    const facadeList = [];
    
    for (const [name, facade] of this.facades) {
      facadeList.push({
        name: name,
        className: facade.constructor.name,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(facade))
          .filter(method => method !== 'constructor' && typeof facade[method] === 'function')
      });
    }

    return facadeList;
  }

  /**
   * Obtém estatísticas dos facades
   * @returns {Object} Estatísticas
   */
  getFacadeStats() {
    return {
      totalFacades: this.facades.size,
      facades: this.listFacades()
    };
  }
}

module.exports = FacadeFactory;
