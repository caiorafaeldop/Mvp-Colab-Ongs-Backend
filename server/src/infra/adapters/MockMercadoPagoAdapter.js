/**
 * MOCK ADAPTER - Mercado Pago para testes
 * Simula todas as operações do Mercado Pago sem fazer chamadas reais
 * Útil para desenvolvimento e testes
 */

const { logger } = require('../logger');

class MockMercadoPagoAdapter {
  constructor() {
    this.mockSubscriptions = new Map(); // Armazena assinaturas em memória
    this.mockPayments = new Map(); // Armazena pagamentos em memória
    logger.info('[MOCK MP] MockMercadoPagoAdapter inicializado - MODO DE TESTE ATIVO');
  }

  /**
   * Cria uma doação única (mock)
   */
  async createSinglePayment(paymentData) {
    try {
      logger.info('[MOCK MP] Criando pagamento único (mock)', { amount: paymentData.amount });

      const mockPaymentId = `mock_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simula resposta do Mercado Pago
      const mockResponse = {
        id: mockPaymentId,
        status: 'pending',
        paymentUrl: `http://localhost:3000/mock/payment/${mockPaymentId}`,
        amount: paymentData.amount,
        currency: 'BRL',
        payer: paymentData.payer,
        externalReference: paymentData.externalReference,
        createdAt: new Date().toISOString(),
      };

      this.mockPayments.set(mockPaymentId, mockResponse);

      logger.info('[MOCK MP] Pagamento único criado (mock)', { id: mockPaymentId });

      return {
        id: mockResponse.id,
        status: mockResponse.status,
        paymentUrl: mockResponse.paymentUrl,
        externalReference: mockResponse.externalReference,
      };
    } catch (error) {
      logger.error('[MOCK MP] Erro ao criar pagamento único (mock)', error.message);
      throw error;
    }
  }

  /**
   * Cria uma assinatura recorrente (mock)
   */
  async createSubscription(subscriptionData) {
    try {
      logger.info('[MOCK MP] Criando assinatura (mock)', {
        amount: subscriptionData.amount,
        frequency: subscriptionData.frequency,
      });

      const mockSubscriptionId = `mock_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simula resposta do Mercado Pago
      const mockResponse = {
        id: mockSubscriptionId,
        status: 'authorized',
        subscriptionUrl: `http://localhost:3000/mock/subscription/${mockSubscriptionId}`,
        amount: subscriptionData.amount,
        frequency: subscriptionData.frequency || 'monthly',
        payer: subscriptionData.payer,
        externalReference: subscriptionData.externalReference,
        createdAt: new Date().toISOString(),
        nextBillingDate: this._getNextBillingDate(subscriptionData.frequency),
      };

      this.mockSubscriptions.set(mockSubscriptionId, mockResponse);

      logger.info('[MOCK MP] Assinatura criada (mock)', { id: mockSubscriptionId });

      return {
        id: mockResponse.id,
        status: mockResponse.status,
        subscriptionUrl: mockResponse.subscriptionUrl,
        externalReference: mockResponse.externalReference,
      };
    } catch (error) {
      logger.error('[MOCK MP] Erro ao criar assinatura (mock)', error.message);
      throw error;
    }
  }

  /**
   * Consulta status de assinatura (mock)
   */
  async getSubscriptionStatus(subscriptionId) {
    try {
      logger.info('[MOCK MP] Consultando status da assinatura (mock)', { subscriptionId });

      const subscription = this.mockSubscriptions.get(subscriptionId);

      if (!subscription) {
        throw new Error('Assinatura não encontrada (mock)');
      }

      return {
        id: subscription.id,
        status: subscription.status,
        amount: subscription.amount,
        frequency: subscription.frequency,
        nextBillingDate: subscription.nextBillingDate,
      };
    } catch (error) {
      logger.error('[MOCK MP] Erro ao consultar assinatura (mock)', error.message);
      throw error;
    }
  }

  /**
   * Atualiza uma assinatura (mock)
   */
  async updateSubscription(subscriptionId, options = {}) {
    try {
      logger.info('[MOCK MP] Atualizando assinatura (mock)', { subscriptionId, options });

      const subscription = this.mockSubscriptions.get(subscriptionId);

      if (!subscription) {
        throw new Error('Assinatura não encontrada (mock)');
      }

      // Atualizar status
      if (options.status) {
        subscription.status = options.status;
      }

      // Atualizar valor
      if (options.amount) {
        subscription.amount = options.amount;
      }

      // Atualizar frequência
      if (options.frequency) {
        subscription.frequency = options.frequency;
        subscription.nextBillingDate = this._getNextBillingDate(options.frequency);
      }

      subscription.updatedAt = new Date().toISOString();
      this.mockSubscriptions.set(subscriptionId, subscription);

      logger.info('[MOCK MP] Assinatura atualizada (mock)', {
        id: subscription.id,
        status: subscription.status,
      });

      return {
        id: subscription.id,
        status: subscription.status,
        amount: subscription.amount,
        frequency: subscription.frequency,
        updated: true,
      };
    } catch (error) {
      logger.error('[MOCK MP] Erro ao atualizar assinatura (mock)', error.message);
      throw error;
    }
  }

  /**
   * Cancela uma assinatura (mock)
   */
  async cancelSubscription(subscriptionId) {
    try {
      logger.info('[MOCK MP] Cancelando assinatura (mock)', { subscriptionId });

      const subscription = this.mockSubscriptions.get(subscriptionId);

      if (!subscription) {
        throw new Error('Assinatura não encontrada (mock)');
      }

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date().toISOString();
      this.mockSubscriptions.set(subscriptionId, subscription);

      logger.info('[MOCK MP] Assinatura cancelada (mock)', { id: subscription.id });

      return {
        id: subscription.id,
        status: 'cancelled',
        cancelled: true,
      };
    } catch (error) {
      logger.error('[MOCK MP] Erro ao cancelar assinatura (mock)', error.message);
      throw error;
    }
  }

  /**
   * Processa webhook (mock)
   */
  async processWebhook(webhookData) {
    try {
      logger.info('[MOCK MP] Processando webhook (mock)', webhookData);

      // Simula processamento de webhook
      return {
        success: true,
        message: 'Webhook processado (mock)',
      };
    } catch (error) {
      logger.error('[MOCK MP] Erro ao processar webhook (mock)', error.message);
      throw error;
    }
  }

  /**
   * Calcula próxima data de cobrança
   */
  _getNextBillingDate(frequency) {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next.toISOString();
  }

  /**
   * Método auxiliar para simular aprovação de pagamento/assinatura
   * Útil para testes
   */
  async mockApprove(id) {
    const subscription = this.mockSubscriptions.get(id);
    if (subscription) {
      subscription.status = 'authorized';
      this.mockSubscriptions.set(id, subscription);
      logger.info('[MOCK MP] Assinatura aprovada manualmente (mock)', { id });
      return true;
    }

    const payment = this.mockPayments.get(id);
    if (payment) {
      payment.status = 'approved';
      this.mockPayments.set(id, payment);
      logger.info('[MOCK MP] Pagamento aprovado manualmente (mock)', { id });
      return true;
    }

    return false;
  }

  /**
   * Limpa dados mock (útil para testes)
   */
  clearMockData() {
    this.mockSubscriptions.clear();
    this.mockPayments.clear();
    logger.info('[MOCK MP] Dados mock limpos');
  }
}

module.exports = MockMercadoPagoAdapter;
