/**
 * ADAPTER PATTERN - Contrato para adaptadores de pagamento
 * Define interface padrão para diferentes provedores de pagamento
 */

class PaymentAdapter {
  /**
   * Cria uma preferência de pagamento único
   * @param {Object} paymentData - Dados do pagamento
   * @param {number} paymentData.amount - Valor do pagamento
   * @param {string} paymentData.title - Título do pagamento
   * @param {string} paymentData.description - Descrição do pagamento
   * @param {Object} paymentData.payer - Dados do pagador
   * @param {string} paymentData.backUrls - URLs de retorno
   * @returns {Promise<Object>} Dados da preferência criada
   */
  async createPaymentPreference(paymentData) {
    throw new Error('createPaymentPreference method must be implemented');
  }

  /**
   * Cria uma assinatura recorrente
   * @param {Object} subscriptionData - Dados da assinatura
   * @param {number} subscriptionData.amount - Valor mensal
   * @param {string} subscriptionData.frequency - Frequência (monthly, weekly, yearly)
   * @param {string} subscriptionData.title - Título da assinatura
   * @param {Object} subscriptionData.payer - Dados do pagador
   * @returns {Promise<Object>} Dados da assinatura criada
   */
  async createSubscription(subscriptionData) {
    throw new Error('createSubscription method must be implemented');
  }

  /**
   * Consulta status de um pagamento
   * @param {string} paymentId - ID do pagamento
   * @returns {Promise<Object>} Status do pagamento
   */
  async getPaymentStatus(paymentId) {
    throw new Error('getPaymentStatus method must be implemented');
  }

  /**
   * Consulta status de uma assinatura
   * @param {string} subscriptionId - ID da assinatura
   * @returns {Promise<Object>} Status da assinatura
   */
  async getSubscriptionStatus(subscriptionId) {
    throw new Error('getSubscriptionStatus method must be implemented');
  }

  /**
   * Cancela uma assinatura
   * @param {string} subscriptionId - ID da assinatura
   * @returns {Promise<Object>} Resultado do cancelamento
   */
  async cancelSubscription(subscriptionId) {
    throw new Error('cancelSubscription method must be implemented');
  }

  /**
   * Processa webhook de notificação
   * @param {Object} webhookData - Dados do webhook
   * @returns {Promise<Object>} Dados processados
   */
  async processWebhook(webhookData) {
    throw new Error('processWebhook method must be implemented');
  }
}

module.exports = PaymentAdapter;
