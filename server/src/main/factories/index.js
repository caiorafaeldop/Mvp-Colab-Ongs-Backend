const MongoUserRepository = require("../../infra/repositories/MongoUserRepository");
const MongoProductRepository = require("../../infra/repositories/MongoProductRepository");
const MongoCollaborationRepository = require("../../infra/repositories/MongoCollaborationRepository");
const MongoFileRepository = require("../../infra/repositories/MongoFileRepository");
const MongoNotificationRepository = require("../../infra/repositories/MongoNotificationRepository");
const EnhancedJwtAuthService = require("../../infra/services/EnhancedJwtAuthService");
const ProductService = require("../../domain/services/ProductService");
const createAuthRoutes = require("../../presentation/routes/authRoutes");
const createProductRoutes = require("../../presentation/routes/productRoutes");
const ObserverFactory = require("./ObserverFactory");
const FacadeFactory = require("./FacadeFactory");
const AdapterFactory = require("./AdapterFactory");
const StrategyFactory = require("./StrategyFactory");
const SingletonFactory = require("./SingletonFactory");
const BridgeFactory = require("./BridgeFactory");
const DecoratorFactory = require("./DecoratorFactory");
const bcrypt = require("bcrypt");

class AppFactory {
  constructor() {
    this.userRepository = null;
    this.productRepository = null;
    this.collaborationRepository = null;
    this.fileRepository = null;
    this.notificationRepository = null;
    this.authService = null;
    this.productService = null;
    this.eventManager = null;
    this.facades = null;
    this.adapters = null;
    this.strategies = null;
    this.singletons = null;
    this.bridges = null;
    this.decorators = null;
  }

  createUserRepository() {
    if (!this.userRepository) {
      this.userRepository = new MongoUserRepository();
    }
    return this.userRepository;
  }

  createProductRepository() {
    if (!this.productRepository) {
      this.productRepository = new MongoProductRepository();
    }
    return this.productRepository;
  }

  createCollaborationRepository() {
    if (!this.collaborationRepository) {
      this.collaborationRepository = new MongoCollaborationRepository();
    }
    return this.collaborationRepository;
  }

  createFileRepository() {
    if (!this.fileRepository) {
      this.fileRepository = new MongoFileRepository();
    }
    return this.fileRepository;
  }

  createNotificationRepository() {
    if (!this.notificationRepository) {
      this.notificationRepository = new MongoNotificationRepository();
    }
    return this.notificationRepository;
  }

  createAuthService() {
    if (!this.authService) {
      const userRepository = this.createUserRepository();
      const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
      this.authService = new EnhancedJwtAuthService(userRepository, jwtSecret, jwtRefreshSecret);
    }
    return this.authService;
  }

  createProductService() {
    if (!this.productService) {
      const productRepository = this.createProductRepository();
      const userRepository = this.createUserRepository();
      this.productService = new ProductService(
        productRepository,
        userRepository
      );
    }
    return this.productService;
  }

  createAuthRoutes() {
    const authService = this.createAuthService();
    return createAuthRoutes(authService);
  }

  createProductRoutes() {
    const productService = this.createProductService();
    const authService = this.createAuthService();
    return createProductRoutes(productService, authService);
  }

  async createEventManager() {
    if (!this.eventManager) {
      const repositories = {
        userRepository: this.createUserRepository(),
        productRepository: this.createProductRepository(),
        notificationRepository: this.createNotificationRepository()
      };

      this.eventManager = await ObserverFactory.initialize(repositories);
      console.log('[AppFactory] EventManager e Observers inicializados');
    }
    return this.eventManager;
  }

  getEventManager() {
    return this.eventManager;
  }

  async createFacades() {
    if (!this.facades) {
      // Cria adapters e strategies primeiro
      await this.createAdapters();
      await this.createStrategies();
      
      const dependencies = {
        productService: this.createProductService(),
        authService: this.createAuthService(),
        userRepository: this.createUserRepository(),
        fileRepository: this.createFileRepository(),
        storageAdapter: this.adapters?.cloudinary,
        eventManager: await this.createEventManager(),
        recommendationStrategy: this.strategies?.categoryRecommendation,
        paymentStrategy: this.strategies?.whatsappPayment
      };

      this.facades = await FacadeFactory.initialize(dependencies);
      console.log('[AppFactory] Facades inicializados');
    }
    return this.facades;
  }

  async createAdapters() {
    if (!this.adapters) {
      this.adapters = await AdapterFactory.initialize();
      console.log('[AppFactory] Adapters inicializados');
    }
    return this.adapters;
  }

  async createStrategies() {
    if (!this.strategies) {
      this.strategies = await StrategyFactory.initialize();
      console.log('[AppFactory] Strategies inicializados');
    }
    return this.strategies;
  }

  getFacades() {
    return this.facades;
  }

  async createSingletons() {
    if (!this.singletons) {
      this.singletons = await SingletonFactory.initialize();
      console.log('[AppFactory] Singletons inicializados');
    }
    return this.singletons;
  }

  getSingletons() {
    return this.singletons;
  }

  async createBridges() {
    if (!this.bridges) {
      // Cria adapters primeiro
      await this.createAdapters();
      
      const dependencies = {
        cloudinaryAdapter: this.adapters?.cloudinary,
        emailAdapter: this.adapters?.email,
        whatsappAdapter: this.adapters?.whatsapp,
        localStoragePath: './uploads'
      };

      this.bridges = await BridgeFactory.initialize(dependencies);
      console.log('[AppFactory] Bridges inicializados');
    }
    return this.bridges;
  }

  getBridges() {
    return this.bridges;
  }

  async createDecorators() {
    if (!this.decorators) {
      // Cria singletons primeiro para obter logger
      await this.createSingletons();
      
      const dependencies = {
        logger: this.singletons?.logger,
        cacheProvider: null // Pode ser implementado depois
      };

      this.decorators = await DecoratorFactory.initialize(dependencies);
      console.log('[AppFactory] Decorators inicializados');
    }
    return this.decorators;
  }

  getDecorators() {
    return this.decorators;
  }

  async comparePassword(password, hashedPassword) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      throw new Error("Login failed: Invalid credentials");
    }
  }

  async jwtLogin(user, password) {
    console.log("[JWT LOGIN] User found:", user);
    console.log("[JWT LOGIN] Comparing password:", password, "with hash:", user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("[JWT LOGIN] Password match result:", isMatch);
    if (!isMatch) {
      throw new Error("Login failed: Invalid credentials");
    }
  }
}

module.exports = AppFactory;
