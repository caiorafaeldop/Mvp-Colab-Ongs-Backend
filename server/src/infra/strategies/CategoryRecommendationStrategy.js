const IRecommendationStrategy = require('../../domain/strategies/IRecommendationStrategy');

/**
 * Estratégia de recomendação baseada em categorias
 * Recomenda produtos similares ou da mesma categoria
 */
class CategoryRecommendationStrategy extends IRecommendationStrategy {
  constructor() {
    super();
    this.name = 'CategoryRecommendationStrategy';
  }

  /**
   * Gera recomendações baseadas em categorias
   * @param {Object} user - Dados do usuário
   * @param {Array<Object>} products - Lista de produtos disponíveis
   * @param {Object} options - Opções da recomendação
   * @returns {Promise<Array<Object>>} Lista de produtos recomendados
   */
  async getRecommendations(user, products, options = {}) {
    try {
      const { limit = 10, currentProductId, preferredCategories = [] } = options;

      // Filtra produtos disponíveis
      let availableProducts = products.filter(product => 
        product.isAvailable && 
        product.id !== currentProductId &&
        product.stock > 0
      );

      // Se usuário tem categorias preferidas (baseado em compras anteriores)
      let recommendedProducts = [];

      if (preferredCategories.length > 0) {
        // Prioriza categorias que o usuário já comprou
        const categoryProducts = availableProducts.filter(product =>
          preferredCategories.includes(product.category)
        );
        recommendedProducts.push(...categoryProducts);
      }

      // Se não tem preferências ou precisa de mais produtos
      if (recommendedProducts.length < limit) {
        const remainingProducts = availableProducts.filter(product =>
          !recommendedProducts.find(rec => rec.id === product.id)
        );
        recommendedProducts.push(...remainingProducts);
      }

      // Calcula scores e ordena
      const scoredProducts = recommendedProducts.map(product => ({
        ...product,
        recommendationScore: this.calculateRelevanceScore(user, product),
        recommendationReason: this.getRecommendationReason(user, product, preferredCategories)
      }));

      // Ordena por score e limita
      return scoredProducts
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);

    } catch (error) {
      console.error('[CategoryRecommendationStrategy] Erro ao gerar recomendações:', error.message);
      return [];
    }
  }

  /**
   * Calcula score de relevância baseado em categoria
   * @param {Object} user - Dados do usuário
   * @param {Object} product - Dados do produto
   * @returns {number} Score de 0 a 1
   */
  calculateRelevanceScore(user, product) {
    let score = 0.5; // Score base

    // Se usuário tem histórico de compras na mesma categoria
    if (user.purchaseHistory && user.purchaseHistory.length > 0) {
      const categoryPurchases = user.purchaseHistory.filter(purchase =>
        purchase.category === product.category
      ).length;

      if (categoryPurchases > 0) {
        score += 0.3; // Bônus por categoria conhecida
      }
    }

    // Bônus por popularidade da categoria
    const popularCategories = ['artesanato', 'alimentação', 'roupas', 'decoração'];
    if (popularCategories.includes(product.category?.toLowerCase())) {
      score += 0.1;
    }

    // Bônus por preço acessível
    if (product.price <= 50) {
      score += 0.1;
    }

    // Penalidade por preço muito alto
    if (product.price > 200) {
      score -= 0.1;
    }

    // Bônus por produto recente
    const daysSinceCreated = Math.floor(
      (new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreated <= 7) {
      score += 0.1; // Produto novo
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Gera razão da recomendação
   * @param {Object} user - Usuário
   * @param {Object} product - Produto
   * @param {Array} preferredCategories - Categorias preferidas
   * @returns {string} Razão da recomendação
   */
  getRecommendationReason(user, product, preferredCategories) {
    if (preferredCategories.includes(product.category)) {
      return `Baseado no seu interesse em ${product.category}`;
    }

    const daysSinceCreated = Math.floor(
      (new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreated <= 7) {
      return 'Produto recém-adicionado';
    }

    if (product.price <= 50) {
      return 'Preço acessível';
    }

    return `Produto popular na categoria ${product.category}`;
  }

  /**
   * Retorna critérios usados na recomendação
   * @returns {Array<string>} Lista de critérios
   */
  getRecommendationCriteria() {
    return [
      'Histórico de compras por categoria',
      'Popularidade da categoria',
      'Faixa de preço',
      'Produtos recentes',
      'Disponibilidade em estoque'
    ];
  }

  /**
   * Retorna o nome da estratégia
   * @returns {string} Nome da estratégia
   */
  getName() {
    return this.name;
  }

  /**
   * Retorna descrição da estratégia
   * @returns {string} Descrição
   */
  getDescription() {
    return 'Recomenda produtos baseado nas categorias de interesse do usuário e popularidade';
  }
}

module.exports = CategoryRecommendationStrategy;
