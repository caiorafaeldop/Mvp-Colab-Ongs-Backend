/**
 * Interface para Repository de Usuários
 * Implementa o Repository Pattern seguindo os princípios SOLID
 */
class IUserRepository {
  /**
   * Salva um usuário no repositório
   * @param {User} user - Entidade de usuário
   * @returns {Promise<User>} Usuário salvo
   */
  async save(user) {
    throw new Error('Method save() must be implemented');
  }

  /**
   * Busca um usuário por ID
   * @param {string} id - ID do usuário
   * @returns {Promise<User|null>} Usuário encontrado ou null
   */
  async findById(id) {
    throw new Error('Method findById() must be implemented');
  }

  /**
   * Busca um usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<User|null>} Usuário encontrado ou null
   */
  async findByEmail(email) {
    throw new Error('Method findByEmail() must be implemented');
  }

  /**
   * Busca usuários por tipo
   * @param {string} userType - Tipo do usuário (organization, common)
   * @returns {Promise<User[]>} Lista de usuários
   */
  async findByUserType(userType) {
    throw new Error('Method findByUserType() must be implemented');
  }

  /**
   * Atualiza um usuário
   * @param {string} id - ID do usuário
   * @param {Object} userData - Dados para atualização
   * @returns {Promise<User|null>} Usuário atualizado ou null
   */
  async update(id, userData) {
    throw new Error('Method update() must be implemented');
  }

  /**
   * Remove um usuário
   * @param {string} id - ID do usuário
   * @returns {Promise<User|null>} Usuário removido ou null
   */
  async delete(id) {
    throw new Error('Method delete() must be implemented');
  }

  /**
   * Busca todos os usuários
   * @returns {Promise<User[]>} Lista de todos os usuários
   */
  async findAll() {
    throw new Error('Method findAll() must be implemented');
  }

  /**
   * Verifica se um usuário existe por email
   * @param {string} email - Email do usuário
   * @returns {Promise<boolean>} True se existe, false caso contrário
   */
  async existsByEmail(email) {
    throw new Error('Method existsByEmail() must be implemented');
  }

  /**
   * Conta o número total de usuários
   * @returns {Promise<number>} Número de usuários
   */
  async count() {
    throw new Error('Method count() must be implemented');
  }

  /**
   * Busca usuários com paginação
   * @param {number} page - Página (começando em 1)
   * @param {number} limit - Limite de itens por página
   * @returns {Promise<{users: User[], total: number, page: number, totalPages: number}>}
   */
  async findWithPagination(page, limit) {
    throw new Error('Method findWithPagination() must be implemented');
  }
}

module.exports = IUserRepository;
