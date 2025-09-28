/**
 * Interface para ProductFacade
 * Define operações completas de produtos no marketplace
 */
class IProductFacade {
  /**
   * Cria produto completo com upload de imagens e notificações
   * @param {Object} productData - Dados do produto
   * @param {Object} user - Usuário criador (ONG)
   * @param {Array<File>} images - Arquivos de imagem
   * @returns {Promise<Object>} Produto criado com URLs das imagens
   */
  async createProductComplete(productData, user, images = []) {
    throw new Error('Method createProductComplete must be implemented');
  }

  /**
   * Compra produto completa com notificações e WhatsApp
   * @param {string} productId - ID do produto
   * @param {Object} buyer - Dados do comprador
   * @param {number} quantity - Quantidade
   * @param {string} paymentMethod - Método de pagamento
   * @returns {Promise<Object>} Resultado da compra com link WhatsApp
   */
  async purchaseProductComplete(productId, buyer, quantity, paymentMethod) {
    throw new Error('Method purchaseProductComplete must be implemented');
  }

  /**
   * Busca produtos com recomendações personalizadas
   * @param {Object} user - Usuário fazendo a busca
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Produtos encontrados + recomendações
   */
  async searchProductsWithRecommendations(user, filters = {}) {
    throw new Error('Method searchProductsWithRecommendations must be implemented');
  }

  /**
   * Atualiza produto com validações e notificações
   * @param {string} productId - ID do produto
   * @param {Object} updateData - Dados para atualizar
   * @param {Object} user - Usuário fazendo a atualização
   * @returns {Promise<Object>} Produto atualizado
   */
  async updateProductComplete(productId, updateData, user) {
    throw new Error('Method updateProductComplete must be implemented');
  }

  /**
   * Remove produto com limpeza completa
   * @param {string} productId - ID do produto
   * @param {Object} user - Usuário removendo
   * @returns {Promise<Object>} Resultado da remoção
   */
  async deleteProductComplete(productId, user) {
    throw new Error('Method deleteProductComplete must be implemented');
  }
}

module.exports = IProductFacade;
