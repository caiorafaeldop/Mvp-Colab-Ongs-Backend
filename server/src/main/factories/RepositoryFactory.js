const MongoUserRepository = require("../../infra/repositories/MongoUserRepository");
const MongoProductRepository = require("../../infra/repositories/MongoProductRepository");
const MongoCollaborationRepository = require("../../infra/repositories/MongoCollaborationRepository");
const MongoFileRepository = require("../../infra/repositories/MongoFileRepository");
const MongoNotificationRepository = require("../../infra/repositories/MongoNotificationRepository");

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
   * Configura o factory com parâmetros específicos
   * @param {Object} configuration - Configurações do factory
   */
  configure(configuration) {
    Object.entries(configuration).forEach(([key, value]) => {
      this.config.set(key, value);
    });
  }

  /**
   * Cria ou retorna instância existente do UserRepository
   * @returns {MongoUserRepository}
   */
  createUserRepository() {
    if (!this.repositories.has('userRepository')) {
      console.log('[REPOSITORY FACTORY] Criando UserRepository');
      
      const repository = new MongoUserRepository();
      this.repositories.set('userRepository', repository);
      
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
      
      const repository = new MongoProductRepository();
      this.repositories.set('productRepository', repository);
      
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
      
      const repository = new MongoCollaborationRepository();
      this.repositories.set('collaborationRepository', repository);
      
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
      
      const repository = new MongoFileRepository();
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
      
      const repository = new MongoNotificationRepository();
      this.repositories.set('notificationRepository', repository);
      
      console.log('[REPOSITORY FACTORY] NotificationRepository criado com sucesso');
    }

    return this.repositories.get('notificationRepository');
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

    // Mapeamento de repositories disponíveis
    const repositoryMap = {
      'userrepository': () => this.createUserRepository(),
      'productrepository': () => this.createProductRepository(),
      'collaborationrepository': () => this.createCollaborationRepository(),
      'filerepository': () => this.createFileRepository(),
      'notificationrepository': () => this.createNotificationRepository(),
    };

    const factory = repositoryMap[repoKey];
    if (!factory) {
      throw new Error(`Repository factory not found for: ${repositoryName}`);
    }

    return factory();
  }

  /**
   * Retorna repository existente sem criar novo
   * @param {string} repositoryName - Nome do repository
   * @returns {Object|null} Instância do repository ou null
   */
  getRepository(repositoryName) {
    return this.repositories.get(repositoryName.toLowerCase()) || null;
  }

  /**
   * Cria todos os repositories de uma vez
   * @returns {Object} Objeto com todos os repositories
   */
  createAllRepositories() {
    console.log('[REPOSITORY FACTORY] Criando todos os repositories');
    
    return {
      userRepository: this.createUserRepository(),
      productRepository: this.createProductRepository(),
      collaborationRepository: this.createCollaborationRepository(),
      fileRepository: this.createFileRepository(),
      notificationRepository: this.createNotificationRepository()
    };
  }

  /**
   * Lista todos os repositories criados
   * @returns {Array<string>} Lista de nomes dos repositories
   */
  getCreatedRepositories() {
    return Array.from(this.repositories.keys());
  }

  /**
   * Limpa cache de repositories (útil para testes)
   */
  clearRepositories() {
    console.log('[REPOSITORY FACTORY] Limpando cache de repositories');
    this.repositories.clear();
  }

  /**
   * Verifica se um repository específico foi criado
   * @param {string} repositoryName - Nome do repository
   * @returns {boolean} True se foi criado
   */
  isRepositoryCreated(repositoryName) {
    return this.repositories.has(repositoryName.toLowerCase());
  }

  /**
   * Retorna informações sobre o estado atual do factory
   * @returns {Object} Estado do factory
   */
  getFactoryState() {
    return {
      repositoriesCreated: this.getCreatedRepositories(),
      totalRepositories: this.repositories.size,
      configuration: Object.fromEntries(this.config)
    };
  }

  /**
   * Registra um repository customizado
   * @param {string} name - Nome do repository
   * @param {Object} repository - Instância do repository
   */
  registerRepository(name, repository) {
    console.log(`[REPOSITORY FACTORY] Registrando repository customizado: ${name}`);
    this.repositories.set(name.toLowerCase(), repository);
  }

  /**
   * Remove um repository do cache
   * @param {string} repositoryName - Nome do repository
   * @returns {boolean} True se foi removido
   */
  removeRepository(repositoryName) {
    const removed = this.repositories.delete(repositoryName.toLowerCase());
    if (removed) {
      console.log(`[REPOSITORY FACTORY] Repository removido: ${repositoryName}`);
    }
    return removed;
  }
}

module.exports = RepositoryFactory;
