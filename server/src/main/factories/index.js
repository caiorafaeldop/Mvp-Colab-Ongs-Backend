const RepositoryFactory = require("./RepositoryFactory");
const ServiceFactory = require("./ServiceFactory");
const createAuthRoutes = require("../../presentation/routes/authRoutes");
const createProductRoutes = require("../../presentation/routes/productRoutes");
const uploadRoutes = require("../../presentation/routes/UploadRoutes");
// Temporariamente comentados para focar no login
// const ObserverFactory = require("./ObserverFactory");
// const FacadeFactory = require("./FacadeFactory");
// const AdapterFactory = require("./AdapterFactory");
// const StrategyFactory = require("./StrategyFactory");
// const SingletonFactory = require("./SingletonFactory");
// const BridgeFactory = require("./BridgeFactory");
// const DecoratorFactory = require("./DecoratorFactory");

/**
 * Factory principal da aplicação seguindo o Factory Pattern
 * Coordena a criação de todos os componentes usando sub-factories
 * Implementa Singleton pattern e Dependency Injection
 */
class AppFactory {
  constructor() {
    // Sub-factories para diferentes tipos de componentes
    this.repositoryFactory = new RepositoryFactory();
    this.serviceFactory = new ServiceFactory();
    
    // Cache de componentes criados
    this.eventManager = null;
    this.facades = null;
    this.adapters = null;
    this.strategies = null;
    this.singletons = null;
    this.bridges = null;
    this.decorators = null;
    
    // Flag para indicar se foi inicializado
    this.initialized = false;
    
    console.log('[APP FACTORY] AppFactory inicializado com sub-factories');
  }

  /**
   * Inicializa o factory com configurações necessárias
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    console.log('[APP FACTORY] Inicializando AppFactory...');
    
    // Configura os sub-factories
    this.repositoryFactory.configure({
      environment: process.env.NODE_ENV || 'development',
      database: 'mongodb'
    });

    // Cria repositories primeiro
    const repositories = this.repositoryFactory.createAllRepositories();
    
    // Registra dependências no ServiceFactory
    this.serviceFactory.registerDependencies(repositories);
    
    this.initialized = true;
    console.log('[APP FACTORY] AppFactory inicializado com sucesso');
  }

  /**
   * Métodos de criação de repositories usando RepositoryFactory
   */
  createUserRepository() {
    return this.repositoryFactory.createUserRepository();
  }

  createProductRepository() {
    return this.repositoryFactory.createProductRepository();
  }

  createCollaborationRepository() {
    return this.repositoryFactory.createCollaborationRepository();
  }

  createFileRepository() {
    return this.repositoryFactory.createFileRepository();
  }

  createNotificationRepository() {
    return this.repositoryFactory.createNotificationRepository();
  }

  /**
   * Métodos de criação de services usando ServiceFactory
   */
  createAuthService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createAuthService();
  }

  createProductService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createProductService();
  }

  /**
   * Métodos de criação de rotas
   */
  createAuthRoutes() {
    const authService = this.createAuthService();
    return createAuthRoutes(authService);
  }

  createProductRoutes() {
    const productService = this.createProductService();
    const authService = this.createAuthService();
    return createProductRoutes(productService, authService);
  }

  createUploadRoutes() {
    // Upload routes não precisam de services específicos por enquanto
    // Usa diretamente o Cloudinary configurado
    return uploadRoutes;
  }

  /**
   * Métodos para obter informações do factory
   */
  getFactoryState() {
    return {
      initialized: this.initialized,
      repositories: this.repositoryFactory.getFactoryState(),
      services: this.serviceFactory.getFactoryState(),
      hasEventManager: !!this.eventManager,
      hasFacades: !!this.facades,
      hasAdapters: !!this.adapters,
      hasStrategies: !!this.strategies,
      hasSingletons: !!this.singletons,
      hasBridges: !!this.bridges,
      hasDecorators: !!this.decorators
    };
  }

  async createEventManager() {
    if (!this.eventManager) {
      // Temporariamente desabilitado até implementar ObserverFactory
      console.log('[AppFactory] EventManager temporariamente desabilitado');
      this.eventManager = {
        emit: async () => {},
        getEventStats: () => ({ totalEvents: 0, recentEvents: [] }),
        getObservers: () => []
      };
    }
    return this.eventManager;
  }

  getEventManager() {
    return this.eventManager;
  }

  async createFacades() {
    if (!this.facades) {
      // Temporariamente desabilitado
      console.log('[AppFactory] Facades temporariamente desabilitados');
      this.facades = {};
    }
    return this.facades;
  }

  async createAdapters() {
    if (!this.adapters) {
      // Temporariamente desabilitado
      console.log('[AppFactory] Adapters temporariamente desabilitados');
      this.adapters = {};
    }
    return this.adapters;
  }

  async createStrategies() {
    if (!this.strategies) {
      // Temporariamente desabilitado
      console.log('[AppFactory] Strategies temporariamente desabilitados');
      this.strategies = {};
    }
    return this.strategies;
  }

  getFacades() {
    return this.facades;
  }

  async createSingletons() {
    if (!this.singletons) {
      // Temporariamente desabilitado
      console.log('[AppFactory] Singletons temporariamente desabilitados');
      this.singletons = {};
    }
    return this.singletons;
  }

  getSingletons() {
    return this.singletons;
  }

  async createBridges() {
    if (!this.bridges) {
      // Temporariamente desabilitado
      console.log('[AppFactory] Bridges temporariamente desabilitados');
      this.bridges = {};
    }
    return this.bridges;
  }

  getBridges() {
    return this.bridges;
  }

  async createDecorators() {
    if (!this.decorators) {
      // Temporariamente desabilitado
      console.log('[AppFactory] Decorators temporariamente desabilitados');
      this.decorators = {};
    }
    return this.decorators;
  }

  getDecorators() {
    return this.decorators;
  }

  /**
   * Limpa todos os caches (útil para testes)
   */
  clearAll() {
    console.log('[APP FACTORY] Limpando todos os caches');
    this.repositoryFactory.clearRepositories();
    this.serviceFactory.clearServices();
    this.eventManager = null;
    this.facades = null;
    this.adapters = null;
    this.strategies = null;
    this.singletons = null;
    this.bridges = null;
    this.decorators = null;
    this.initialized = false;
  }
}

module.exports = AppFactory;
