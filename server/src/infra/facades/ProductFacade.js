const IProductFacade = require('../../domain/facades/IProductFacade');

/**
 * Facade para operações completas de produtos no marketplace
 * Simplifica operações complexas envolvendo múltiplos services
 */
class ProductFacade extends IProductFacade {
  constructor(
    productService,
    userRepository,
    storageAdapter,
    eventManager,
    recommendationStrategy,
    paymentStrategy
  ) {
    super();
    this.productService = productService;
    this.userRepository = userRepository;
    this.storageAdapter = storageAdapter;
    this.eventManager = eventManager;
    this.recommendationStrategy = recommendationStrategy;
    this.paymentStrategy = paymentStrategy;
  }

  /**
   * Cria produto completo com upload de imagens e notificações
   * @param {Object} productData - Dados do produto
   * @param {Object} user - Usuário criador (ONG)
   * @param {Array<File>} images - Arquivos de imagem
   * @returns {Promise<Object>} Produto criado com URLs das imagens
   */
  async createProductComplete(productData, user, images = []) {
    try {
      console.log(`[ProductFacade] Criando produto completo: ${productData.name}`);

      // 1. Valida se usuário é ONG
      if (user.userType !== 'organization') {
        throw new Error('Apenas ONGs podem criar produtos');
      }

      // 2. Upload das imagens (se fornecidas)
      let imageUrls = [];
      if (images && images.length > 0) {
        console.log(`[ProductFacade] Fazendo upload de ${images.length} imagens`);
        
        const uploadPromises = images.map(async (image) => {
          const result = await this.storageAdapter.uploadFile(image, {
            folder: 'products',
            transformation: { width: 800, height: 600, crop: 'fill' }
          });
          return result.secure_url;
        });

        imageUrls = await Promise.all(uploadPromises);
        console.log(`[ProductFacade] Upload concluído: ${imageUrls.length} URLs geradas`);
      }

      // 3. Cria produto com URLs das imagens
      const productWithImages = {
        ...productData,
        imageUrls: imageUrls,
        organizationId: user.id,
        organizationName: user.name
      };

      const product = await this.productService.createProduct(productWithImages, user.id);

      // 4. Emite evento de produto criado
      if (this.eventManager) {
        await this.eventManager.emit('product.created', {
          product: product,
          organization: user,
          imageCount: imageUrls.length
        });
      }

      console.log(`[ProductFacade] Produto criado com sucesso: ${product.id}`);

      return {
        success: true,
        product: product,
        imageUrls: imageUrls,
        message: 'Produto criado e publicado com sucesso!'
      };

    } catch (error) {
      console.error('[ProductFacade] Erro ao criar produto:', error.message);
      
      // Emite evento de erro
      if (this.eventManager) {
        await this.eventManager.emit('system.error', {
          error: error,
          component: 'ProductFacade.createProductComplete',
          severity: 'medium',
          userId: user.id
        });
      }

      throw error;
    }
  }

  /**
   * Compra produto completa com notificações e WhatsApp
   * @param {string} productId - ID do produto
   * @param {Object} buyer - Dados do comprador
   * @param {number} quantity - Quantidade
   * @param {string} paymentMethod - Método de pagamento
   * @returns {Promise<Object>} Resultado da compra com link WhatsApp
   */
  async purchaseProductComplete(productId, buyer, quantity = 1, paymentMethod = 'whatsapp') {
    try {
      console.log(`[ProductFacade] Processando compra: produto ${productId} para ${buyer.name}`);

      // 1. Busca produto e valida disponibilidade
      const product = await this.productService.getProductById(productId);
      if (!product) {
        throw new Error('Produto não encontrado');
      }

      if (!product.isAvailable) {
        throw new Error('Produto não está disponível');
      }

      if (product.stock && product.stock < quantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${product.stock}`);
      }

      // 2. Busca dados da ONG vendedora
      const seller = await this.userRepository.findById(product.organizationId);
      if (!seller) {
        throw new Error('ONG vendedora não encontrada');
      }

      // 3. Calcula valor total
      const totalPrice = product.price * quantity;

      // 4. Processa pagamento usando strategy
      const paymentData = {
        amount: totalPrice,
        buyer: buyer,
        seller: seller,
        product: product,
        quantity: quantity
      };

      const paymentResult = await this.paymentStrategy.processPayment(paymentData);

      if (!paymentResult.success) {
        throw new Error(`Erro no pagamento: ${paymentResult.error}`);
      }

      // 5. Atualiza estoque do produto
      if (product.stock !== undefined) {
        const newStock = product.stock - quantity;
        await this.productService.updateProduct(productId, { stock: newStock }, seller.id);
      }

      // 6. Emite evento de compra
      if (this.eventManager) {
        await this.eventManager.emit('product.purchased', {
          product: product,
          buyer: buyer,
          quantity: quantity,
          totalPrice: totalPrice,
          paymentMethod: paymentMethod,
          paymentResult: paymentResult
        });

        // Verifica se é primeira compra do usuário
        // (aqui você poderia consultar histórico de compras)
        await this.eventManager.emit('user.first_purchase', {
          user: buyer,
          product: product,
          totalPrice: totalPrice
        });
      }

      console.log(`[ProductFacade] Compra processada com sucesso`);

      return {
        success: true,
        purchase: {
          productId: productId,
          productName: product.name,
          quantity: quantity,
          totalPrice: totalPrice,
          buyerName: buyer.name,
          sellerName: seller.name,
          paymentMethod: paymentMethod
        },
        payment: paymentResult,
        message: 'Compra realizada com sucesso! A ONG entrará em contato.'
      };

    } catch (error) {
      console.error('[ProductFacade] Erro ao processar compra:', error.message);
      
      if (this.eventManager) {
        await this.eventManager.emit('system.error', {
          error: error,
          component: 'ProductFacade.purchaseProductComplete',
          severity: 'high',
          userId: buyer.id
        });
      }

      throw error;
    }
  }

  /**
   * Busca produtos com recomendações personalizadas
   * @param {Object} user - Usuário fazendo a busca
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Produtos encontrados + recomendações
   */
  async searchProductsWithRecommendations(user, filters = {}) {
    try {
      console.log(`[ProductFacade] Buscando produtos para ${user.name}`);

      // 1. Busca produtos com filtros
      const products = await this.productService.searchProducts(filters);

      // 2. Gera recomendações personalizadas
      let recommendations = [];
      if (this.recommendationStrategy && products.length > 0) {
        recommendations = await this.recommendationStrategy.getRecommendations(
          user, 
          products, 
          { limit: 5 }
        );
      }

      // 3. Emite evento de busca
      if (this.eventManager) {
        await this.eventManager.emit('user.search_performed', {
          user: user,
          searchQuery: filters.search || '',
          resultsCount: products.length,
          filters: filters
        });
      }

      console.log(`[ProductFacade] Busca concluída: ${products.length} produtos, ${recommendations.length} recomendações`);

      return {
        success: true,
        products: products,
        recommendations: recommendations,
        totalFound: products.length,
        filters: filters
      };

    } catch (error) {
      console.error('[ProductFacade] Erro na busca:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza produto com validações e notificações
   * @param {string} productId - ID do produto
   * @param {Object} updateData - Dados para atualizar
   * @param {Object} user - Usuário fazendo a atualização
   * @returns {Promise<Object>} Produto atualizado
   */
  async updateProductComplete(productId, updateData, user) {
    try {
      console.log(`[ProductFacade] Atualizando produto ${productId}`);

      // 1. Busca produto atual
      const currentProduct = await this.productService.getProductById(productId);
      if (!currentProduct) {
        throw new Error('Produto não encontrado');
      }

      // 2. Valida permissão
      if (currentProduct.organizationId !== user.id) {
        throw new Error('Você não tem permissão para atualizar este produto');
      }

      // 3. Atualiza produto
      const updatedProduct = await this.productService.updateProduct(productId, updateData, user.id);

      // 4. Emite evento de atualização
      if (this.eventManager) {
        await this.eventManager.emit('product.updated', {
          product: updatedProduct,
          changes: updateData,
          updatedBy: user.id
        });
      }

      console.log(`[ProductFacade] Produto atualizado com sucesso`);

      return {
        success: true,
        product: updatedProduct,
        message: 'Produto atualizado com sucesso!'
      };

    } catch (error) {
      console.error('[ProductFacade] Erro ao atualizar produto:', error.message);
      throw error;
    }
  }

  /**
   * Remove produto com limpeza completa
   * @param {string} productId - ID do produto
   * @param {Object} user - Usuário removendo
   * @returns {Promise<Object>} Resultado da remoção
   */
  async deleteProductComplete(productId, user) {
    try {
      console.log(`[ProductFacade] Removendo produto ${productId}`);

      // 1. Busca produto
      const product = await this.productService.getProductById(productId);
      if (!product) {
        throw new Error('Produto não encontrado');
      }

      // 2. Valida permissão
      if (product.organizationId !== user.id) {
        throw new Error('Você não tem permissão para remover este produto');
      }

      // 3. Remove imagens do storage
      if (product.imageUrls && product.imageUrls.length > 0) {
        console.log(`[ProductFacade] Removendo ${product.imageUrls.length} imagens`);
        
        const deletePromises = product.imageUrls.map(async (imageUrl) => {
          try {
            await this.storageAdapter.deleteFile(imageUrl);
          } catch (error) {
            console.warn(`[ProductFacade] Erro ao remover imagem ${imageUrl}:`, error.message);
          }
        });

        await Promise.all(deletePromises);
      }

      // 4. Remove produto do banco
      await this.productService.deleteProduct(productId, user.id);

      console.log(`[ProductFacade] Produto removido com sucesso`);

      return {
        success: true,
        message: 'Produto removido com sucesso!'
      };

    } catch (error) {
      console.error('[ProductFacade] Erro ao remover produto:', error.message);
      throw error;
    }
  }
}

module.exports = ProductFacade;
