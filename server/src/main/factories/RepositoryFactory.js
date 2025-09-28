const MongoUserRepository = require("../../infra/repositories/MongoUserRepository");
const MongoProductRepository = require("../../infra/repositories/MongoProductRepository");
const MongoCollaborationRepository = require("../../infra/repositories/MongoCollaborationRepository");
const MongoFileRepository = require("../../infra/repositories/MongoFileRepository");
const MongoNotificationRepository = require("../../infra/repositories/MongoNotificationRepository");
const PrismaDonationRepository = require("../../infra/repositories/PrismaDonationRepository");

/**
 * Factory para criação de Repositories seguindo o Factory Pattern
 * Centraliza a criação e configuração de todos os repositories da aplicação
 * Implementa Singleton pattern para garantir uma única instância por tipo
 */
class RepositoryFactory {
  constructor() {
    this.repositories = new Map();
    this.config = new Map();
  }

  /**
   * Define configuração para os repositories
   * @param {string} key - Chave da configuração
   * @param {*} value - Valor da configuração
   */
  setConfig(key, value) {
    this.config.set(key, value);
  }

  /**
   * Configura o factory com um objeto de configurações
   * @param {Object} config - Objeto com configurações
   */
  configure(config) {
    console.log('[REPOSITORY FACTORY] Configurando factory:', config);
    
    Object.entries(config).forEach(([key, value]) => {
      this.setConfig(key, value);
    });
    
    console.log('[REPOSITORY FACTORY] Factory configurado com sucesso');
  }

  /**
   * Cria ou retorna instância existente do UserRepository
   * @returns {MongoUserRepository}
   */
  createUserRepository() {
    if (!this.repositories.has('userRepository')) {
      console.log('[REPOSITORY FACTORY] Criando UserRepository');
      const database = this.config.get('database');
      const userRepository = new MongoUserRepository(database);
      this.repositories.set('userRepository', userRepository);
      console.log('[REPOSITORY FACTORY] UserRepository criado com sucesso');
    }

    return this.repositories.get('userRepository');
  }

  /**
   * Cria ou retorna instância existente do ProductRepository
   * @returns {MongoProductRepository}
   */
  createProductRepository() {
    if (!this.repositories.has('productRepository')) {
      console.log('[REPOSITORY FACTORY] Criando ProductRepository');
      const database = this.config.get('database');
      const productRepository = new MongoProductRepository(database);
      this.repositories.set('productRepository', productRepository);
      console.log('[REPOSITORY FACTORY] ProductRepository criado com sucesso');
    }

    return this.repositories.get('productRepository');
  }

  /**
   * Cria ou retorna instância existente do CollaborationRepository
   * @returns {MongoCollaborationRepository}
   */
  createCollaborationRepository() {
    if (!this.repositories.has('collaborationRepository')) {
      console.log('[REPOSITORY FACTORY] Criando CollaborationRepository');
      const database = this.config.get('database');
      const collaborationRepository = new MongoCollaborationRepository(database);
      this.repositories.set('collaborationRepository', collaborationRepository);
      console.log('[REPOSITORY FACTORY] CollaborationRepository criado com sucesso');
    }

    return this.repositories.get('collaborationRepository');
  }

  /**
   * Cria ou retorna instância existente do FileRepository
   * @returns {MongoFileRepository}
   */
  createFileRepository() {
    if (!this.repositories.has('fileRepository')) {
      console.log('[REPOSITORY FACTORY] Criando FileRepository');
      const database = this.config.get('database');
      const repository = new MongoFileRepository(database);
      this.repositories.set('fileRepository', repository);
      console.log('[REPOSITORY FACTORY] FileRepository criado com sucesso');
    }

    return this.repositories.get('fileRepository');
  }

  /**
   * Cria ou retorna instância existente do NotificationRepository
   * @returns {MongoNotificationRepository}
   */
  createNotificationRepository() {
    if (!this.repositories.has('notificationRepository')) {
      console.log('[REPOSITORY FACTORY] Criando NotificationRepository');
      const database = this.config.get('database');
      const repository = new MongoNotificationRepository(database);
      this.repositories.set('notificationRepository', repository);
      console.log('[REPOSITORY FACTORY] NotificationRepository criado com sucesso');
    }

    return this.repositories.get('notificationRepository');
  }

  /**
   * Cria ou retorna instância existente do DonationRepository
   * @returns {PrismaDonationRepository}
   */
  createDonationRepository() {
    if (!this.repositories.has('donationRepository')) {
      console.log('[REPOSITORY FACTORY] Criando DonationRepository');
      const donationRepository = new PrismaDonationRepository();
      this.repositories.set('donationRepository', donationRepository);
      console.log('[REPOSITORY FACTORY] DonationRepository criado com sucesso');
    }

    return this.repositories.get('donationRepository');
  }

  /**
   * Cria repository por nome usando reflexão
   * @param {string} repositoryName - Nome do repository
   * @returns {Object} Instância do repository
   */
  createRepository(repositoryName) {
    const repoKey = repositoryName.toLowerCase();
    
    if (this.repositories.has(repoKey)) {
      return this.repositories.get(repoKey);
    }

    console.log(`[REPOSITORY FACTORY] Criando repository genérico: ${repositoryName}`);
    
    // Mapear nomes para métodos de criação
    const methodMap = {
      'user': 'createUserRepository',
      'product': 'createProductRepository',
      'collaboration': 'createCollaborationRepository',
      'file': 'createFileRepository',
      'notification': 'createNotificationRepository',
      'donation': 'createDonationRepository'
    };

    const methodName = methodMap[repoKey];
    if (methodName && typeof this[methodName] === 'function') {
      return this[methodName]();
    }

    throw new Error(`Repository não encontrado: ${repositoryName}`);
  }

  /**
   * Cria todos os repositories de uma vez
   * @returns {Object} Mapa com todos os repositories
   */
  createAllRepositories() {
    console.log('[REPOSITORY FACTORY] Criando todos os repositories');
    
    const repositories = {
      userRepository: this.createUserRepository(),
      productRepository: this.createProductRepository(),
      collaborationRepository: this.createCollaborationRepository(),
      fileRepository: this.createFileRepository(),
      notificationRepository: this.createNotificationRepository(),
      donationRepository: this.createDonationRepository()
    };

    console.log('[REPOSITORY FACTORY] Todos os repositories criados com sucesso');
    return repositories;
  }

  /**
   * Limpa todas as instâncias (útil para testes)
   */
  clear() {
    console.log('[REPOSITORY FACTORY] Limpando todas as instâncias');
    this.repositories.clear();
  }

  /**
   * Retorna estatísticas dos repositories criados
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalRepositories: this.repositories.size,
      repositories: Array.from(this.repositories.keys()),
      configs: Array.from(this.config.keys())
    };
  }

  /**
   * Retorna o estado atual do factory
   * @returns {Object} Estado do factory
   */
  getFactoryState() {
    return {
      initialized: true,
      repositoriesCount: this.repositories.size,
      repositories: Array.from(this.repositories.keys()),
      configs: Object.fromEntries(this.config),
      status: 'ready'
    };
  }
}

module.exports = RepositoryFactory;
