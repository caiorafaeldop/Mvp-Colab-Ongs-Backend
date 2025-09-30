const IObserver = require('../../domain/observers/IObserver');
const { logger } = require('../logger');

/**
 * Observer para eventos relacionados a produtos
 * Monitora criação, atualização, deleção e mudanças de estoque
 */
class ProductObserver extends IObserver {
  constructor() {
    super();
    this.name = 'ProductObserver';
    this.eventTypes = [
      'product.created',
      'product.updated',
      'product.deleted',
      'product.stock.low',
      'product.availability.changed'
    ];
  }

  /**
   * Processa evento de produto
   */
  async update(event, context) {
    try {
      logger.info(`[${this.name}] Processando evento: ${event.type}`, {
        eventId: event.id,
        productId: event.data?.productId,
        timestamp: event.timestamp
      });

      switch (event.type) {
        case 'product.created':
          await this.handleProductCreated(event, context);
          break;
        case 'product.updated':
          await this.handleProductUpdated(event, context);
          break;
        case 'product.deleted':
          await this.handleProductDeleted(event, context);
          break;
        case 'product.stock.low':
          await this.handleStockLow(event, context);
          break;
        case 'product.availability.changed':
          await this.handleAvailabilityChanged(event, context);
          break;
        default:
          logger.warn(`[${this.name}] Tipo de evento não tratado: ${event.type}`);
      }
    } catch (error) {
      logger.error(`[${this.name}] Erro ao processar evento`, {
        error: error.message,
        eventType: event.type,
        eventId: event.id
      });
    }
  }

  /**
   * Verifica se deve processar este evento
   */
  shouldHandle(event) {
    return this.eventTypes.includes(event.type);
  }

  getName() {
    return this.name;
  }

  getEventTypes() {
    return this.eventTypes;
  }

  // Handlers específicos
  async handleProductCreated(event, context) {
    logger.info(`[${this.name}] Novo produto criado`, {
      productId: event.data.productId,
      productName: event.data.productName,
      organizationId: event.data.organizationId,
      price: event.data.price
    });

    // Aqui pode adicionar lógica adicional como:
    // - Enviar notificação para administradores
    // - Atualizar cache
    // - Indexar produto para busca
    // - Enviar analytics
  }

  async handleProductUpdated(event, context) {
    logger.info(`[${this.name}] Produto atualizado`, {
      productId: event.data.productId,
      changes: event.data.changes
    });

    // Lógica adicional para produto atualizado
    // - Invalidar cache
    // - Notificar usuários interessados
  }

  async handleProductDeleted(event, context) {
    logger.info(`[${this.name}] Produto deletado`, {
      productId: event.data.productId,
      organizationId: event.data.organizationId
    });

    // Lógica adicional para produto deletado
    // - Limpar cache
    // - Remover de índices de busca
  }

  async handleStockLow(event, context) {
    logger.warn(`[${this.name}] Estoque baixo detectado`, {
      productId: event.data.productId,
      productName: event.data.productName,
      currentStock: event.data.currentStock,
      threshold: event.data.threshold
    });

    // Lógica para estoque baixo
    // - Enviar alerta para organização
    // - Sugerir reposição
  }

  async handleAvailabilityChanged(event, context) {
    logger.info(`[${this.name}] Disponibilidade alterada`, {
      productId: event.data.productId,
      isAvailable: event.data.isAvailable
    });

    // Lógica para mudança de disponibilidade
    // - Atualizar cache
    // - Notificar usuários
  }
}

module.exports = ProductObserver;
