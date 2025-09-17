const IObserver = require('../../domain/observers/IObserver');

/**
 * Observer para eventos de vendas de produtos
 * Monitora compras, vendas e estoque no marketplace de ONGs
 */
class ProductSaleObserver extends IObserver {
  constructor(notificationRepository, userRepository, productRepository) {
    super();
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.productRepository = productRepository;
    this.name = 'ProductSaleObserver';
  }

  /**
   * Processa eventos de vendas e produtos
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async update(event, context = {}) {
    try {
      switch (event.type) {
        case 'product.purchased':
          await this.handleProductPurchased(event.data, context);
          break;
        case 'product.low_stock':
          await this.handleLowStock(event.data, context);
          break;
        case 'product.out_of_stock':
          await this.handleOutOfStock(event.data, context);
          break;
        case 'product.created':
          await this.handleProductCreated(event.data, context);
          break;
        case 'product.updated':
          await this.handleProductUpdated(event.data, context);
          break;
        default:
          console.log(`[ProductSaleObserver] Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error(`[ProductSaleObserver] Erro ao processar evento ${event.type}:`, error.message);
    }
  }

  /**
   * Trata evento de produto comprado
   * @param {Object} data - Dados da compra
   * @param {Object} context - Contexto
   */
  async handleProductPurchased(data, context) {
    const { product, buyer, quantity, totalPrice, paymentMethod } = data;

    console.log(`[ProductSaleObserver] Produto vendido: ${product.name} para ${buyer.name}`);

    if (this.notificationRepository) {
      // Notifica a ONG sobre a venda
      await this.notificationRepository.create({
        userId: product.organizationId,
        type: 'product_sold',
        title: 'Produto Vendido! 🎉',
        message: `Seu produto "${product.name}" foi vendido para ${buyer.name}`,
        data: {
          productId: product.id,
          productName: product.name,
          buyerId: buyer.id,
          buyerName: buyer.name,
          quantity: quantity,
          totalPrice: totalPrice,
          paymentMethod: paymentMethod,
          whatsappLink: product.getWhatsAppLink(buyer.phone)
        },
        priority: 'high'
      });

      // Confirma compra para o comprador
      await this.notificationRepository.create({
        userId: buyer.id,
        type: 'purchase_confirmed',
        title: 'Compra Confirmada! ✅',
        message: `Sua compra de "${product.name}" foi confirmada. A ONG ${product.organizationName} entrará em contato.`,
        data: {
          productId: product.id,
          productName: product.name,
          organizationName: product.organizationName,
          quantity: quantity,
          totalPrice: totalPrice,
          nextSteps: 'Aguarde o contato da ONG para combinar entrega/retirada'
        },
        priority: 'high'
      });
    }

    // Atualiza estoque do produto
    if (this.productRepository && product.stock !== undefined) {
      const newStock = product.stock - quantity;
      
      if (newStock <= 0) {
        // Produto esgotado
        await this.handleOutOfStock({ product: { ...product, stock: 0 } }, context);
      } else if (newStock <= 5) {
        // Estoque baixo
        await this.handleLowStock({ product: { ...product, stock: newStock } }, context);
      }
    }

    // Log para métricas
    console.log(`[ProductSaleObserver] Métricas - Venda: R$ ${totalPrice}, Método: ${paymentMethod}`);
  }

  /**
   * Trata estoque baixo
   * @param {Object} data - Dados do produto
   * @param {Object} context - Contexto
   */
  async handleLowStock(data, context) {
    const { product } = data;

    console.log(`[ProductSaleObserver] Estoque baixo: ${product.name} (${product.stock} unidades)`);

    if (this.notificationRepository) {
      await this.notificationRepository.create({
        userId: product.organizationId,
        type: 'low_stock_alert',
        title: 'Estoque Baixo! ⚠️',
        message: `O produto "${product.name}" está com apenas ${product.stock} unidades restantes`,
        data: {
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          suggestion: 'Considere repor o estoque ou atualizar a quantidade disponível'
        },
        priority: 'medium'
      });
    }
  }

  /**
   * Trata produto esgotado
   * @param {Object} data - Dados do produto
   * @param {Object} context - Contexto
   */
  async handleOutOfStock(data, context) {
    const { product } = data;

    console.log(`[ProductSaleObserver] Produto esgotado: ${product.name}`);

    if (this.notificationRepository) {
      await this.notificationRepository.create({
        userId: product.organizationId,
        type: 'out_of_stock',
        title: 'Produto Esgotado! 📦',
        message: `O produto "${product.name}" está esgotado`,
        data: {
          productId: product.id,
          productName: product.name,
          actions: [
            'Repor estoque',
            'Desativar produto temporariamente',
            'Atualizar descrição com previsão de reposição'
          ]
        },
        priority: 'high'
      });
    }

    // Automaticamente desativa produto esgotado
    if (this.productRepository) {
      try {
        await this.productRepository.update(product.id, { isAvailable: false });
        console.log(`[ProductSaleObserver] Produto ${product.name} desativado automaticamente`);
      } catch (error) {
        console.error('[ProductSaleObserver] Erro ao desativar produto:', error.message);
      }
    }
  }

  /**
   * Trata criação de novo produto
   * @param {Object} data - Dados do produto
   * @param {Object} context - Contexto
   */
  async handleProductCreated(data, context) {
    const { product, organization } = data;

    console.log(`[ProductSaleObserver] Novo produto criado: ${product.name}`);

    if (this.notificationRepository) {
      // Confirma para a ONG
      await this.notificationRepository.create({
        userId: product.organizationId,
        type: 'product_created',
        title: 'Produto Publicado! 🆕',
        message: `Seu produto "${product.name}" foi publicado com sucesso no marketplace`,
        data: {
          productId: product.id,
          productName: product.name,
          price: product.price,
          category: product.category,
          tips: [
            'Adicione fotos atrativas',
            'Mantenha a descrição atualizada',
            'Responda rapidamente aos interessados'
          ]
        },
        priority: 'medium'
      });
    }

    // Log para métricas
    console.log(`[ProductSaleObserver] Métricas - Novo produto: ${product.category}, R$ ${product.price}`);
  }

  /**
   * Trata atualização de produto
   * @param {Object} data - Dados do produto
   * @param {Object} context - Contexto
   */
  async handleProductUpdated(data, context) {
    const { product, changes } = data;

    console.log(`[ProductSaleObserver] Produto atualizado: ${product.name}`);

    // Se o preço foi alterado significativamente, notifica
    if (changes.price && Math.abs(changes.price - product.price) > product.price * 0.2) {
      if (this.notificationRepository) {
        const priceChange = changes.price > product.price ? 'aumentado' : 'reduzido';
        
        await this.notificationRepository.create({
          userId: product.organizationId,
          type: 'price_change_alert',
          title: `Preço ${priceChange}`,
          message: `O preço do produto "${product.name}" foi ${priceChange} significativamente`,
          data: {
            productId: product.id,
            productName: product.name,
            oldPrice: product.price,
            newPrice: changes.price,
            changePercent: Math.round(((changes.price - product.price) / product.price) * 100)
          },
          priority: 'low'
        });
      }
    }
  }

  /**
   * Retorna o nome do observer
   * @returns {string} Nome do observer
   */
  getName() {
    return this.name;
  }

  /**
   * Retorna os tipos de evento que este observer escuta
   * @returns {Array<string>} Lista de tipos de evento
   */
  getEventTypes() {
    return [
      'product.purchased',
      'product.low_stock',
      'product.out_of_stock',
      'product.created',
      'product.updated'
    ];
  }
}

module.exports = ProductSaleObserver;
