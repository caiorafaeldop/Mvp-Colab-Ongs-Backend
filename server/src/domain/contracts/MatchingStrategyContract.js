/**
 * Interface para estratégias de matching entre ONGs
 * Define o contrato padrão que todas as estratégias de matching devem seguir
 */
class IMatchingStrategy {
  /**
   * Calcula score de compatibilidade entre duas ONGs
   * @param {Object} requesterOrg - ONG que está buscando parceria
   * @param {Object} targetOrg - ONG candidata a parceria
   * @param {Object} context - Contexto adicional (projeto, recursos necessários, etc.)
   * @returns {Promise<Object>} Score e detalhes da compatibilidade
   */
  async calculateCompatibility(requesterOrg, targetOrg, context = {}) {
    throw new Error('Method calculateCompatibility must be implemented by concrete strategy');
  }

  /**
   * Encontra as melhores ONGs compatíveis
   * @param {Object} requesterOrg - ONG que está buscando parceria
   * @param {Array} candidateOrgs - Lista de ONGs candidatas
   * @param {Object} criteria - Critérios de busca
   * @returns {Promise<Array>} Lista ordenada por compatibilidade
   */
  async findBestMatches(requesterOrg, candidateOrgs, criteria = {}) {
    throw new Error('Method findBestMatches must be implemented by concrete strategy');
  }

  /**
   * Retorna o nome da estratégia
   * @returns {string} Nome da estratégia
   */
  getStrategyName() {
    throw new Error('Method getStrategyName must be implemented by concrete strategy');
  }

  /**
   * Retorna os critérios que esta estratégia considera
   * @returns {Array<string>} Lista de critérios
   */
  getCriteria() {
    throw new Error('Method getCriteria must be implemented by concrete strategy');
  }

  /**
   * Valida se os dados necessários estão presentes
   * @param {Object} orgData - Dados da organização
   * @returns {boolean} True se os dados estão válidos
   */
  validateOrgData(orgData) {
    throw new Error('Method validateOrgData must be implemented by concrete strategy');
  }
}

module.exports = IMatchingStrategy;
