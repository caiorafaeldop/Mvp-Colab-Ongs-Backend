/**
 * Interface para estratégias de pagamento no marketplace
 * Define o contrato padrão para diferentes métodos de pagamento
 */
class IPaymentStrategy {
  /**
   * Processa um pagamento
   * @param {Object} paymentData - Dados do pagamento
   * @param {Object} paymentData.amount - Valor a ser pago
   * @param {Object} paymentData.buyer - Dados do comprador
   * @param {Object} paymentData.seller - Dados da ONG vendedora
   * @param {Object} paymentData.product - Dados do produto
   * @returns {Promise<Object>} Resultado do processamento
   */
  async processPayment(paymentData) {
    throw new Error('Method processPayment must be implemented by concrete strategy');
  }

  /**
   * Valida dados do pagamento
   * @param {Object} paymentData - Dados a serem validados
   * @returns {Object} Resultado da validação
   */
  validatePaymentData(paymentData) {
    throw new Error('Method validatePaymentData must be implemented by concrete strategy');
  }

  /**
   * Retorna informações sobre o método de pagamento
   * @returns {Object} Informações do método
   */
  getPaymentMethodInfo() {
    throw new Error('Method getPaymentMethodInfo must be implemented by concrete strategy');
  }

  /**
   * Calcula taxas do método de pagamento
   * @param {number} amount - Valor base
   * @returns {Object} Detalhes das taxas
   */
  calculateFees(amount) {
    throw new Error('Method calculateFees must be implemented by concrete strategy');
  }

  /**
   * Verifica se o método está disponível
   * @returns {boolean} True se disponível
   */
  isAvailable() {
    throw new Error('Method isAvailable must be implemented by concrete strategy');
  }

  /**
   * Retorna o nome da estratégia
   * @returns {string} Nome da estratégia
   */
  getName() {
    throw new Error('Method getName must be implemented by concrete strategy');
  }
}

module.exports = IPaymentStrategy;
