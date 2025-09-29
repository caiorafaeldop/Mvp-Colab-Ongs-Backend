// PrismaRepositoryFactory temporariamente desabilitado - usando MongoDB
const RepositoryFactory = require("./MongoRepositoryFactory");
const ServiceFactory = require("./ServiceFactory");
const createAuthRoutes = require("../../presentation/routes/authRoutes");
const createSimpleAuthRoutes = require("../../presentation/routes/simpleAuthRoutes");
const createProductRoutes = require("../../presentation/routes/productRoutes");
const createDonationRoutes = require("../../presentation/routes/donationRoutes");
const createUploadRoutes = require("../../presentation/routes/UploadRoutes");
// Factories removidos na limpeza - não utilizados
const AdapterFactory = require("./AdapterFactory");
const BridgeFactory = require("./BridgeFactory");

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
    this.bridges = null;
    
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
    
    // Inicializa repositories MongoDB
    const repositories = await this.repositoryFactory.initialize();
    
    // Registra dependências no ServiceFactory
    this.serviceFactory.registerDependencies(repositories);

    // Configurar bridges de storage/notification
    const storageAdapter = AdapterFactory.createDefaultStorageAdapter();
    this.bridges = await BridgeFactory.initialize({
      cloudinaryAdapter: storageAdapter,
      localStoragePath: process.env.LOCAL_UPLOAD_PATH || './uploads'
    });
    
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

  createDonationRepository() {
    return this.repositoryFactory.createDonationRepository();
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

  createSimpleAuthService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createSimpleAuthService();
  }

  createProductService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createProductService();
  }

  createDonationService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createDonationService();
  }

  /**
   * Métodos de criação de rotas
   */
  createAuthRoutes() {
    const authService = this.createAuthService();
    return createAuthRoutes(authService);
  }

  createSimpleAuthRoutes() {
    const simpleAuthService = this.createSimpleAuthService();
    return createSimpleAuthRoutes(simpleAuthService);
  }

  createProductRoutes() {
    const productService = this.createProductService();
    const authService = this.createSimpleAuthService(); // Usar o novo sistema simplificado
    return createProductRoutes(productService, authService);
  }

  createDonationRoutes() {
    const donationService = this.createDonationService();
    const authService = this.createSimpleAuthService(); // Para autenticação nas rotas protegidas
    return createDonationRoutes(donationService, authService);
  }

  createUploadRoutes() {
    // Seleciona bridge conforme preferência/env
    const preference = (process.env.STORAGE_BRIDGE || 'cloudinary').toLowerCase();
    const storageBridge = preference === 'local' 
      ? this.bridges?.storage?.local 
      : this.bridges?.storage?.cloudinary;

    if (!storageBridge) {
      throw new Error('Storage bridge is not initialized');
    }

    return createUploadRoutes(storageBridge);
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
      hasBridges: !!this.bridges
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

  getBridges() {
    return this.bridges;
  }

  /**
   * Limpa todos os caches (útil para testes)
   */
  clearAll() {
    console.log('[APP FACTORY] Limpando todos os caches');
    this.repositoryFactory.clearRepositories();
    this.serviceFactory.clearServices();
    this.eventManager = null;
    this.bridges = null;
    this.initialized = false;
  }
}

module.exports = AppFactory;
