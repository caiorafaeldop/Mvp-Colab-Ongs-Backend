/**
 * REPOSITORY PATTERN - Interface para repositório de doações
 * Define contrato para persistência de doações
 */

class IDonationRepository {
  /**
   * Cria uma nova doação
   * @param {Object} donationData - Dados da doação
   * @returns {Promise<Object>} Doação criada
   */
  async create(donationData) {
    throw new Error('create method must be implemented');
  }

  /**
   * Busca doação por ID
   * @param {string} id - ID da doação
   * @returns {Promise<Object|null>} Doação encontrada
   */
  async findById(id) {
    throw new Error('findById method must be implemented');
  }

  /**
   * Busca doação por ID do Mercado Pago
   * @param {string} mercadoPagoId - ID do pagamento no Mercado Pago
   * @returns {Promise<Object|null>} Doação encontrada
   */
  async findByMercadoPagoId(mercadoPagoId) {
    throw new Error('findByMercadoPagoId method must be implemented');
  }

  /**
   * Busca doação por ID da assinatura
   * @param {string} subscriptionId - ID da assinatura no Mercado Pago
   * @returns {Promise<Object|null>} Doação encontrada
   */
  async findBySubscriptionId(subscriptionId) {
    throw new Error('findBySubscriptionId method must be implemented');
  }

  /**
   * Busca doações por organização
   * @param {string} organizationId - ID da organização
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Array>} Lista de doações
   */
  async findByOrganizationId(organizationId, filters = {}) {
    throw new Error('findByOrganizationId method must be implemented');
  }

  /**
   * Busca doações por status
   * @param {string} status - Status da doação
   * @returns {Promise<Array>} Lista de doações
   */
  async findByStatus(status) {
    throw new Error('findByStatus method must be implemented');
  }

  /**
   * Busca doações por tipo
   * @param {string} type - Tipo da doação (single, recurring)
   * @returns {Promise<Array>} Lista de doações
   */
  async findByType(type) {
    throw new Error('findByType method must be implemented');
  }

  /**
   * Busca doações por email do doador
   * @param {string} donorEmail - Email do doador
   * @returns {Promise<Array>} Lista de doações
   */
  async findByDonorEmail(donorEmail) {
    throw new Error('findByDonorEmail method must be implemented');
  }

  /**
   * Atualiza uma doação
   * @param {string} id - ID da doação
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} Doação atualizada
   */
  async update(id, updateData) {
    throw new Error('update method must be implemented');
  }

  /**
   * Remove uma doação
   * @param {string} id - ID da doação
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async delete(id) {
    throw new Error('delete method must be implemented');
  }

  /**
   * Lista todas as doações com paginação
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Object>} Resultado paginado
   */
  async findAll(options = {}) {
    throw new Error('findAll method must be implemented');
  }

  /**
   * Conta doações por filtros
   * @param {Object} filters - Filtros para contagem
   * @returns {Promise<number>} Número de doações
   */
  async count(filters = {}) {
    throw new Error('count method must be implemented');
  }

  /**
   * Busca estatísticas de doações
   * @param {string} organizationId - ID da organização
   * @param {Object} dateRange - Período para análise
   * @returns {Promise<Object>} Estatísticas
   */
  async getStatistics(organizationId, dateRange = {}) {
    throw new Error('getStatistics method must be implemented');
  }
}

module.exports = IDonationRepository;
