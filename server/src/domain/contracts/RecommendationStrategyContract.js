/**
 * Interface para estratégias de recomendação de produtos
 * Define o contrato para diferentes algoritmos de recomendação no marketplace
 */
class IRecommendationStrategy {
  /**
   * Gera recomendações de produtos para um usuário
   * @param {Object} user - Dados do usuário
   * @param {Array<Object>} products - Lista de produtos disponíveis
   * @param {Object} options - Opções da recomendação
   * @returns {Promise<Array<Object>>} Lista de produtos recomendados
   */
  async getRecommendations(user, products, options = {}) {
    throw new Error('Method getRecommendations must be implemented by concrete strategy');
  }

  /**
   * Calcula score de relevância de um produto para o usuário
   * @param {Object} user - Dados do usuário
   * @param {Object} product - Dados do produto
   * @returns {number} Score de 0 a 1
   */
  calculateRelevanceScore(user, product) {
    throw new Error('Method calculateRelevanceScore must be implemented by concrete strategy');
  }

  /**
   * Retorna critérios usados na recomendação
   * @returns {Array<string>} Lista de critérios
   */
  getRecommendationCriteria() {
    throw new Error('Method getRecommendationCriteria must be implemented by concrete strategy');
  }

  /**
   * Retorna o nome da estratégia
   * @returns {string} Nome da estratégia
   */
  getName() {
    throw new Error('Method getName must be implemented by concrete strategy');
  }

  /**
   * Retorna descrição da estratégia
   * @returns {string} Descrição
   */
  getDescription() {
    throw new Error('Method getDescription must be implemented by concrete strategy');
  }
}

module.exports = IRecommendationStrategy;
