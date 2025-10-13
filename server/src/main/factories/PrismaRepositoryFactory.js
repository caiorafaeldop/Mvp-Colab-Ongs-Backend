// Prisma Repositories
const PrismaUserRepository = require('../../infra/repositories/PrismaUserRepository');
const PrismaProductRepository = require('../../infra/repositories/PrismaProductRepository');
const PrismaCollaborationRepository = require('../../infra/repositories/PrismaCollaborationRepository');
const PrismaTopDonorRepository = require('../../infra/repositories/PrismaTopDonorRepository');

// MongoDB Repositories (fallback)
const MongoUserRepository = require('../../infra/repositories/MongoUserRepository');
const MongoProductRepository = require('../../infra/repositories/MongoProductRepository');
const MongoCollaborationRepository = require('../../infra/repositories/MongoCollaborationRepository');
const MongoFileRepository = require('../../infra/repositories/MongoFileRepository');
const MongoNotificationRepository = require('../../infra/repositories/MongoNotificationRepository');

// Prisma Service
const PrismaService = require('../../infra/singletons/PrismaService');
const PrismaDonationRepository = require('../../infra/repositories/PrismaDonationRepository');

/**
 * Factory para criação de Repositories com suporte a Prisma e MongoDB
 * Implementa Strategy Pattern para escolher entre diferentes implementações
 * Mantém compatibilidade com o sistema existente
 */
class PrismaRepositoryFactory {
  constructor() {
    this.repositories = new Map();
    this.config = new Map();
    this.databaseStrategy = 'prisma'; // 'prisma' ou 'mongodb'
    this.prismaService = null;
  }

  /**
   * Cria ou retorna instância existente do DonationRepository
   * Sempre Prisma (não há implementação MongoDB)
   * @returns {PrismaDonationRepository}
   */
  async createDonationRepository() {
    if (!this.repositories.has('donationRepository')) {
      console.log('[PRISMA REPOSITORY FACTORY] Criando DonationRepository (Prisma)');
      const repository = new PrismaDonationRepository();
      this.repositories.set('donationRepository', repository);
      console.log('[PRISMA REPOSITORY FACTORY] DonationRepository criado com sucesso');
    }

    return this.repositories.get('donationRepository');
  }

  /**
   * Cria ou retorna instância existente do TopDonorRepository
   * Sempre Prisma (não há implementação MongoDB)
   * @returns {PrismaTopDonorRepository}
   */
  async createTopDonorRepository() {
    if (!this.repositories.has('topDonorRepository')) {
      console.log('[PRISMA REPOSITORY FACTORY] Criando TopDonorRepository (Prisma)');
      const repository = new PrismaTopDonorRepository();
      this.repositories.set('topDonorRepository', repository);
      console.log('[PRISMA REPOSITORY FACTORY] TopDonorRepository criado com sucesso');
    }

    return this.repositories.get('topDonorRepository');
  }

  /**
   * Configura o factory com parâmetros específicos
   * @param {Object} configuration - Configurações do factory
   */
  configure(configuration) {
    Object.entries(configuration).forEach(([key, value]) => {
      this.config.set(key, value);
    });

    // Configurar estratégia de banco de dados
    if (configuration.databaseStrategy) {
      this.databaseStrategy = configuration.databaseStrategy;
    }
  }

  /**
   * Inicializa o PrismaService se necessário
   * @returns {Promise<void>}
   */
  async initializePrisma() {
    if (this.databaseStrategy === 'prisma' && !this.prismaService) {
      console.log('[PRISMA REPOSITORY FACTORY] Inicializando PrismaService...');
      this.prismaService = PrismaService.getInstance();
      await this.prismaService.initialize();
      console.log('[PRISMA REPOSITORY FACTORY] PrismaService inicializado com sucesso');
    }
  }

  /**
   * Verifica se deve usar Prisma ou MongoDB
   * @returns {boolean} True se deve usar Prisma
   * @private
   */
  _shouldUsePrisma() {
    return this.databaseStrategy === 'prisma' && this.prismaService && this.prismaService.isReady();
  }

  /**
   * Cria ou retorna instância existente do UserRepository
   * @returns {PrismaUserRepository|MongoUserRepository}
   */
  async createUserRepository() {
    if (!this.repositories.has('userRepository')) {
      console.log('[PRISMA REPOSITORY FACTORY] Criando UserRepository');

      await this.initializePrisma();

      let repository;
      if (this._shouldUsePrisma()) {
        console.log('[PRISMA REPOSITORY FACTORY] Usando PrismaUserRepository');
        repository = new PrismaUserRepository();
      } else {
        console.log('[PRISMA REPOSITORY FACTORY] Fallback para MongoUserRepository');
        repository = new MongoUserRepository();
      }

      this.repositories.set('userRepository', repository);
      console.log('[PRISMA REPOSITORY FACTORY] UserRepository criado com sucesso');
    }

    return this.repositories.get('userRepository');
  }

  /**
   * Cria ou retorna instância existente do ProductRepository
   * @returns {PrismaProductRepository|MongoProductRepository}
   */
  async createProductRepository() {
    if (!this.repositories.has('productRepository')) {
      console.log('[PRISMA REPOSITORY FACTORY] Criando ProductRepository');

      await this.initializePrisma();

      let repository;
      if (this._shouldUsePrisma()) {
        console.log('[PRISMA REPOSITORY FACTORY] Usando PrismaProductRepository');
        repository = new PrismaProductRepository();
      } else {
        console.log('[PRISMA REPOSITORY FACTORY] Fallback para MongoProductRepository');
        repository = new MongoProductRepository();
      }

      this.repositories.set('productRepository', repository);
      console.log('[PRISMA REPOSITORY FACTORY] ProductRepository criado com sucesso');
    }

    return this.repositories.get('productRepository');
  }

  /**
   * Cria ou retorna instância existente do CollaborationRepository
   * @returns {PrismaCollaborationRepository|MongoCollaborationRepository}
   */
  async createCollaborationRepository() {
    if (!this.repositories.has('collaborationRepository')) {
      console.log('[PRISMA REPOSITORY FACTORY] Criando CollaborationRepository');

      await this.initializePrisma();

      let repository;
      if (this._shouldUsePrisma()) {
        console.log('[PRISMA REPOSITORY FACTORY] Usando PrismaCollaborationRepository');
        repository = new PrismaCollaborationRepository();
      } else {
        console.log('[PRISMA REPOSITORY FACTORY] Fallback para MongoCollaborationRepository');
        repository = new MongoCollaborationRepository();
      }

      this.repositories.set('collaborationRepository', repository);
      console.log('[PRISMA REPOSITORY FACTORY] CollaborationRepository criado com sucesso');
    }

    return this.repositories.get('collaborationRepository');
  }

  /**
   * Cria ou retorna instância existente do FileRepository
   * Nota: Ainda usa MongoDB pois não foi migrado para Prisma
   * @returns {MongoFileRepository}
   */
  async createFileRepository() {
    if (!this.repositories.has('fileRepository')) {
      console.log('[PRISMA REPOSITORY FACTORY] Criando FileRepository (MongoDB)');

      const repository = new MongoFileRepository();
      this.repositories.set('fileRepository', repository);

      console.log('[PRISMA REPOSITORY FACTORY] FileRepository criado com sucesso');
    }

    return this.repositories.get('fileRepository');
  }

  /**
   * Cria ou retorna instância existente do NotificationRepository
   * Nota: Ainda usa MongoDB pois não foi migrado para Prisma
   * @returns {MongoNotificationRepository}
   */
  async createNotificationRepository() {
    if (!this.repositories.has('notificationRepository')) {
      console.log('[PRISMA REPOSITORY FACTORY] Criando NotificationRepository (MongoDB)');

      const repository = new MongoNotificationRepository();
      this.repositories.set('notificationRepository', repository);

      console.log('[PRISMA REPOSITORY FACTORY] NotificationRepository criado com sucesso');
    }

    return this.repositories.get('notificationRepository');
  }

  /**
   * Cria repository por nome usando reflexão
   * @param {string} repositoryName - Nome do repository
   * @returns {Promise<Object>} Instância do repository
   */
  async createRepository(repositoryName) {
    const repoKey = repositoryName.toLowerCase();

    if (this.repositories.has(repoKey)) {
      return this.repositories.get(repoKey);
    }

    console.log(`[PRISMA REPOSITORY FACTORY] Criando repository genérico: ${repositoryName}`);

    // Mapeamento de repositories disponíveis
    const repositoryMap = {
      userrepository: () => this.createUserRepository(),
      productrepository: () => this.createProductRepository(),
      collaborationrepository: () => this.createCollaborationRepository(),
      filerepository: () => this.createFileRepository(),
      notificationrepository: () => this.createNotificationRepository(),
    };

    const factory = repositoryMap[repoKey];
    if (!factory) {
      throw new Error(`Repository factory not found for: ${repositoryName}`);
    }

    return await factory();
  }

  /**
   * Cria todos os repositories de uma vez
   * @returns {Promise<Object>} Objeto com todos os repositories
   */
  async createAllRepositories() {
    console.log('[PRISMA REPOSITORY FACTORY] Criando todos os repositories');

    return {
      userRepository: await this.createUserRepository(),
      productRepository: await this.createProductRepository(),
      collaborationRepository: await this.createCollaborationRepository(),
      fileRepository: await this.createFileRepository(),
      notificationRepository: await this.createNotificationRepository(),
      donationRepository: await this.createDonationRepository(),
      topDonorRepository: await this.createTopDonorRepository(),
    };
  }

  /**
   * Alterna entre estratégias de banco de dados
   * @param {string} strategy - 'prisma' ou 'mongodb'
   */
  async switchDatabaseStrategy(strategy) {
    if (!['prisma', 'mongodb'].includes(strategy)) {
      throw new Error('Estratégia de banco deve ser "prisma" ou "mongodb"');
    }

    console.log(`[PRISMA REPOSITORY FACTORY] Alternando estratégia para: ${strategy}`);

    // Limpar repositories existentes para forçar recriação
    this.repositories.clear();
    this.databaseStrategy = strategy;

    if (strategy === 'prisma') {
      await this.initializePrisma();
    }

    console.log(`[PRISMA REPOSITORY FACTORY] Estratégia alterada para: ${strategy}`);
  }

  /**
   * Retorna informações sobre o estado atual do factory
   * @returns {Object} Estado do factory
   */
  getFactoryState() {
    return {
      repositoriesCreated: Array.from(this.repositories.keys()),
      totalRepositories: this.repositories.size,
      databaseStrategy: this.databaseStrategy,
      prismaReady: this.prismaService ? this.prismaService.isReady() : false,
      configuration: Object.fromEntries(this.config),
    };
  }

  /**
   * Verifica a saúde dos repositories
   * @returns {Promise<Object>} Status de saúde
   */
  async healthCheck() {
    const health = {
      strategy: this.databaseStrategy,
      prismaService: null,
      repositories: {},
    };

    // Verificar PrismaService
    if (this.prismaService) {
      health.prismaService = {
        isReady: this.prismaService.isReady(),
        ping: await this.prismaService.ping(),
      };
    }

    // Verificar repositories criados
    for (const [name, repo] of this.repositories) {
      health.repositories[name] = {
        created: true,
        type: repo.constructor.name,
      };
    }

    return health;
  }

  /**
   * Limpa cache de repositories (útil para testes)
   */
  clearRepositories() {
    console.log('[PRISMA REPOSITORY FACTORY] Limpando cache de repositories');
    this.repositories.clear();
  }

  /**
   * Destrói o factory e limpa recursos
   */
  async destroy() {
    console.log('[PRISMA REPOSITORY FACTORY] Destruindo factory...');

    this.repositories.clear();

    if (this.prismaService) {
      await this.prismaService.disconnect();
      this.prismaService = null;
    }

    console.log('[PRISMA REPOSITORY FACTORY] Factory destruído');
  }

  // Métodos de compatibilidade com o RepositoryFactory original
  getRepository(repositoryName) {
    return this.repositories.get(repositoryName.toLowerCase()) || null;
  }

  getCreatedRepositories() {
    return Array.from(this.repositories.keys());
  }

  isRepositoryCreated(repositoryName) {
    return this.repositories.has(repositoryName.toLowerCase());
  }

  registerRepository(name, repository) {
    console.log(`[PRISMA REPOSITORY FACTORY] Registrando repository customizado: ${name}`);
    this.repositories.set(name.toLowerCase(), repository);
  }

  removeRepository(repositoryName) {
    const removed = this.repositories.delete(repositoryName.toLowerCase());
    if (removed) {
      console.log(`[PRISMA REPOSITORY FACTORY] Repository removido: ${repositoryName}`);
    }
    return removed;
  }
}

module.exports = PrismaRepositoryFactory;
