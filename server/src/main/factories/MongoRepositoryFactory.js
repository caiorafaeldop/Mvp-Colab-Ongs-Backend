// MongoDB Repositories
const MongoUserRepository = require('../../infra/repositories/MongoUserRepository');
const MongoProductRepository = require('../../infra/repositories/MongoProductRepository');
const MongoCollaborationRepository = require('../../infra/repositories/MongoCollaborationRepository');
const MongoFileRepository = require('../../infra/repositories/MongoFileRepository');
const MongoNotificationRepository = require('../../infra/repositories/MongoNotificationRepository');
const MongoDonationRepository = require('../../infra/repositories/MongoDonationRepository');

// Prisma Repository para TopDonor (usa Prisma com MongoDB)
const PrismaTopDonorRepository = require('../../infra/repositories/PrismaTopDonorRepository');
const PrismaSupporterRepository = require('../../infra/repositories/PrismaSupporterRepository');
const PrismaPrestacaoContasRepository = require('../../infra/repositories/PrismaPrestacaoContasRepository');
// Prisma Service singleton (para garantir inicialização do cliente Prisma)
const PrismaService = require('../../infra/singletons/PrismaService');

/**
 * Factory para criação de repositories MongoDB
 * Implementa Strategy Pattern para alternar entre diferentes tipos de persistência
 */
class MongoRepositoryFactory {
  constructor() {
    this.repositories = {};
    this.initialized = false;
    console.log('[MongoRepositoryFactory] Factory inicializado');
  }

  /**
   * Cria repository de usuários
   * @returns {MongoUserRepository} Repository de usuários
   */
  createUserRepository() {
    if (!this.repositories.user) {
      this.repositories.user = new MongoUserRepository();
      console.log('[MongoRepositoryFactory] MongoUserRepository criado');
    }
    return this.repositories.user;
  }

  /**
   * Cria repository de produtos
   * @returns {MongoProductRepository} Repository de produtos
   */
  createProductRepository() {
    if (!this.repositories.product) {
      this.repositories.product = new MongoProductRepository();
      console.log('[MongoRepositoryFactory] MongoProductRepository criado');
    }
    return this.repositories.product;
  }

  /**
   * Cria repository de colaborações
   * @returns {MongoCollaborationRepository} Repository de colaborações
   */
  createCollaborationRepository() {
    if (!this.repositories.collaboration) {
      this.repositories.collaboration = new MongoCollaborationRepository();
      console.log('[MongoRepositoryFactory] MongoCollaborationRepository criado');
    }
    return this.repositories.collaboration;
  }

  /**
   * Cria repository de arquivos
   * @returns {MongoFileRepository} Repository de arquivos
   */
  createFileRepository() {
    if (!this.repositories.file) {
      this.repositories.file = new MongoFileRepository();
      console.log('[MongoRepositoryFactory] MongoFileRepository criado');
    }
    return this.repositories.file;
  }

  /**
   * Cria repository de notificações
   * @returns {MongoNotificationRepository} Repository de notificações
   */
  createNotificationRepository() {
    if (!this.repositories.notification) {
      this.repositories.notification = new MongoNotificationRepository();
      console.log('[MongoRepositoryFactory] MongoNotificationRepository criado');
    }
    return this.repositories.notification;
  }

  /**
   * Cria repository de doações
   * @returns {MongoDonationRepository} Repository de doações
   */
  createDonationRepository() {
    if (!this.repositories.donation) {
      this.repositories.donation = new MongoDonationRepository();
      console.log('[MongoRepositoryFactory] MongoDonationRepository criado');
    }
    return this.repositories.donation;
  }

  /**
   * Cria repository de doadores de destaque (Prisma)
   * @returns {PrismaTopDonorRepository} Repository de doadores de destaque
   */
  createTopDonorRepository() {
    if (!this.repositories.topDonor) {
      this.repositories.topDonor = new PrismaTopDonorRepository();
      console.log('[MongoRepositoryFactory] PrismaTopDonorRepository criado');
    }
    return this.repositories.topDonor;
  }

  /**
   * Cria repository de colaboradores/apoiadores (Prisma)
   * @returns {PrismaSupporterRepository}
   */
  createSupporterRepository() {
    if (!this.repositories.supporter) {
      this.repositories.supporter = new PrismaSupporterRepository();
      console.log('[MongoRepositoryFactory] PrismaSupporterRepository criado');
    }
    return this.repositories.supporter;
  }

  /**
   * Cria repository de prestação de contas (Prisma)
   * @returns {PrismaPrestacaoContasRepository}
   */
  createPrestacaoContasRepository() {
    if (!this.repositories.prestacaoContas) {
      this.repositories.prestacaoContas = new PrismaPrestacaoContasRepository();
      console.log('[MongoRepositoryFactory] PrismaPrestacaoContasRepository criado');
    }
    return this.repositories.prestacaoContas;
  }

  /**
   * Obtém todos os repositories criados
   * @returns {Object} Objeto com todos os repositories
   */
  getAllRepositories() {
    return {
      userRepository: this.createUserRepository(),
      productRepository: this.createProductRepository(),
      collaborationRepository: this.createCollaborationRepository(),
      fileRepository: this.createFileRepository(),
      notificationRepository: this.createNotificationRepository(),
      donationRepository: this.createDonationRepository(),
      topDonorRepository: this.createTopDonorRepository(),
      supporterRepository: this.createSupporterRepository(),
      prestacaoContasRepository: this.createPrestacaoContasRepository(),
    };
  }

  /**
   * Limpa cache de repositories
   */
  clearRepositories() {
    console.log('[MongoRepositoryFactory] Limpando cache de repositories');
    this.repositories = {};
    this.initialized = false;
  }

  /**
   * Obtém informações do factory
   * @returns {Object} Estado do factory
   */
  getFactoryState() {
    return {
      type: 'MongoDB',
      initialized: this.initialized,
      repositoriesCreated: Object.keys(this.repositories),
      totalRepositories: Object.keys(this.repositories).length,
    };
  }

  /**
   * Inicializa todos os repositories
   * @returns {Promise<Object>} Repositories inicializados
   */
  async initialize() {
    if (this.initialized) {
      console.log('[MongoRepositoryFactory] Já inicializado');
      return this.getAllRepositories();
    }

    console.log('[MongoRepositoryFactory] Inicializando todos os repositories...');

    // Garantir que o PrismaService seja inicializado antes de criar/usar repositories Prisma
    try {
      const prismaService = PrismaService.getInstance();
      await prismaService.initialize();
      console.log(
        '[MongoRepositoryFactory] PrismaService inicializado (status):',
        prismaService.getStatus()
      );
    } catch (err) {
      // Não bloquear inicialização geral se Prisma não estiver disponível; apenas logar
      console.warn(
        '[MongoRepositoryFactory] Aviso: Falha ao inicializar PrismaService:',
        err?.message
      );
    }

    const repositories = this.getAllRepositories();
    this.initialized = true;

    console.log('[MongoRepositoryFactory] Todos os repositories inicializados');
    return repositories;
  }
}

module.exports = MongoRepositoryFactory;
