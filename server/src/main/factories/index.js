// PrismaRepositoryFactory temporariamente desabilitado - usando MongoDB
const RepositoryFactory = require('./MongoRepositoryFactory');
const ServiceFactory = require('./ServiceFactory');
const ObserverFactory = require('./ObserverFactory');
const createAuthRoutes = require('../../presentation/routes/authRoutes');
const createSimpleAuthRoutes = require('../../presentation/routes/simpleAuthRoutes');
const createProductRoutes = require('../../presentation/routes/productRoutes');
const createDonationRoutes = require('../../presentation/routes/donationRoutes');
const createUploadRoutes = require('../../presentation/routes/UploadRoutes');
const {
  createAuthenticatedTopDonorRoutes,
  createPublicTopDonorRoutes,
} = require('../../presentation/routes/topDonorRoutes');
const TopDonorController = require('../../presentation/controllers/TopDonorController');
const {
  createAuthenticatedSupporterRoutes,
  createPublicSupporterRoutes,
} = require('../../presentation/routes/supporterRoutes');
const SupporterController = require('../../presentation/controllers/SupporterController');
const createPrestacaoContasRoutes = require('../../presentation/routes/prestacaoContasRoutes');
const createFAQRoutes = require('../../presentation/routes/faqRoutes');
const createTestimonialRoutes = require('../../presentation/routes/testimonialRoutes');
const createVerificationRoutes = require('../../presentation/routes/verificationRoutes');
// Factories removidos na limpeza - não utilizados
const AdapterFactory = require('./AdapterFactory');
const BridgeFactory = require('./BridgeFactory');

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
    this.observerFactory = new ObserverFactory();

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
      localStoragePath: process.env.LOCAL_UPLOAD_PATH || './uploads',
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

  createTopDonorRepository() {
    return this.repositoryFactory.createTopDonorRepository();
  }

  createPrestacaoContasRepository() {
    return this.repositoryFactory.createPrestacaoContasRepository();
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

  createTopDonorService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createTopDonorService();
  }

  createSupporterService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createSupporterService();
  }

  createPrestacaoContasService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createPrestacaoContasService();
  }

  createFAQService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createFAQService();
  }

  createTestimonialService() {
    if (!this.initialized) {
      throw new Error('AppFactory must be initialized before creating services');
    }
    return this.serviceFactory.createTestimonialService();
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
    const storageBridge =
      preference === 'local' ? this.bridges?.storage?.local : this.bridges?.storage?.cloudinary;

    if (!storageBridge) {
      throw new Error('Storage bridge is not initialized');
    }

    return createUploadRoutes(storageBridge);
  }

  createTopDonorRoutes() {
    console.log('[APP FACTORY] Criando rotas de TopDonor...');

    console.log('[APP FACTORY] Criando TopDonorService...');
    const topDonorService = this.createTopDonorService();
    console.log('[APP FACTORY] TopDonorService criado:', !!topDonorService);

    console.log('[APP FACTORY] Criando SimpleAuthService...');
    const authService = this.createSimpleAuthService();
    console.log('[APP FACTORY] SimpleAuthService criado:', !!authService);

    console.log('[APP FACTORY] Criando TopDonorController...');
    const topDonorController = new TopDonorController(topDonorService);
    console.log('[APP FACTORY] TopDonorController criado:', !!topDonorController);

    console.log('[APP FACTORY] Criando rotas autenticadas...');
    const routes = createAuthenticatedTopDonorRoutes(authService, topDonorController);
    console.log('[APP FACTORY] Rotas de TopDonor criadas com sucesso!');

    return routes;
  }

  createPublicTopDonorRoutes() {
    console.log('[APP FACTORY] Criando rotas públicas de TopDonor...');

    const topDonorService = this.createTopDonorService();
    const topDonorController = new TopDonorController(topDonorService);
    const routes = createPublicTopDonorRoutes(topDonorController);
    return routes;
  }

  createSupporterRoutes() {
    console.log('[APP FACTORY] Criando rotas de Supporter...');

    const supporterService = this.createSupporterService();
    const authService = this.createSimpleAuthService();
    const supporterController = new SupporterController(supporterService);
    const routes = createAuthenticatedSupporterRoutes(authService, supporterController);
    return routes;
  }

  createPublicSupporterRoutes() {
    console.log('[APP FACTORY] Criando rotas públicas de Supporter...');

    const supporterService = this.createSupporterService();
    const supporterController = new SupporterController(supporterService);
    const routes = createPublicSupporterRoutes(supporterController);
    return routes;
  }

  createPrestacaoContasRoutes() {
    console.log('[APP FACTORY] Criando rotas de Prestação de Contas...');

    const prestacaoContasService = this.createPrestacaoContasService();
    const authService = this.createSimpleAuthService();
    const routes = createPrestacaoContasRoutes(prestacaoContasService, authService);
    return routes;
  }

  createFAQRoutes() {
    console.log('[APP FACTORY] Criando rotas de FAQ...');

    const faqService = this.createFAQService();
    const authService = this.createSimpleAuthService();
    const routes = createFAQRoutes(faqService, authService);
    return routes;
  }

  createTestimonialRoutes() {
    console.log('[APP FACTORY] Criando rotas de Testimonials...');

    const testimonialService = this.createTestimonialService();
    const authService = this.createSimpleAuthService();
    const routes = createTestimonialRoutes(testimonialService, authService);
    return routes;
  }

  createVerificationRoutes() {
    console.log('[APP FACTORY] Criando rotas de Verificação...');

    const VerificationController = require('../../presentation/controllers/VerificationController');
    const { VerifyEmailUseCase, PasswordResetUseCase } = require('../../application/use-cases');
    const {
      MongoVerificationCodeRepository,
    } = require('../../infra/repositories/MongoVerificationCodeRepository');
    const { getEmailService } = require('../../infra/services/EmailService');
    const { getDatabase } = require('../../infra/database/mongodb');

    // Criar repositórios e serviços
    const userRepository = this.createUserRepository();
    const db = getDatabase();
    const verificationCodeRepository = new MongoVerificationCodeRepository(db);
    const emailService = getEmailService();

    // Criar Use Cases
    const verifyEmailUseCase = new VerifyEmailUseCase(
      userRepository,
      verificationCodeRepository,
      emailService
    );
    const passwordResetUseCase = new PasswordResetUseCase(
      userRepository,
      verificationCodeRepository,
      emailService
    );

    // Criar Controller
    const verificationController = new VerificationController(
      verifyEmailUseCase,
      passwordResetUseCase
    );

    const routes = createVerificationRoutes(verificationController);
    console.log('[APP FACTORY] Rotas de Verificação criadas com sucesso!');
    return routes;
  }

  /**
   * Métodos para obter informações do factory
   */
  getFactoryState() {
    return {
      initialized: this.initialized,
      repositories: this.repositoryFactory.getFactoryState(),
      services: this.serviceFactory.getFactoryState(),
      observers: this.observerFactory.getCreatedObservers(),
      hasEventManager: !!this.eventManager,
      hasBridges: !!this.bridges,
    };
  }

  async createEventManager() {
    if (!this.eventManager) {
      const { getInstance } = require('../../infra/events/EventManager');
      this.eventManager = getInstance();
      console.log('[AppFactory] EventManager criado com sucesso');
    }
    return this.eventManager;
  }

  getEventManager() {
    return this.eventManager;
  }

  /**
   * Cria ou retorna ObserverFactory
   */
  createObserverFactory() {
    return this.observerFactory;
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
