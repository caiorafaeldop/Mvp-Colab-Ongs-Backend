/**
 * Interface para Notification Bridges
 * Define operações que um bridge de notificação deve expor
 */
class INotificationBridge {
  /**
   * Envia notificação
   * @param {Object} notification - Dados da notificação
   * @param {Object} recipient - Destinatário
   * @param {Object} options - Opções de envio
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendNotification(notification, recipient, options = {}) {
    throw new Error('Method sendNotification must be implemented by concrete bridge');
  }

  /**
   * Envia notificação em lote
   * @param {Object} notification - Dados da notificação
   * @param {Array} recipients - Lista de destinatários
   * @param {Object} options - Opções de envio
   * @returns {Promise<Object>} Resultado do envio em lote
   */
  async sendBulkNotification(notification, recipients, options = {}) {
    throw new Error('Method sendBulkNotification must be implemented by concrete bridge');
  }

  /**
   * Verifica status de entrega
   * @param {string} notificationId - ID da notificação
   * @returns {Promise<Object>} Status da entrega
   */
  async getDeliveryStatus(notificationId) {
    throw new Error('Method getDeliveryStatus must be implemented by concrete bridge');
  }

  /**
   * Obtém informações do canal
   * @returns {Object} Informações do canal
   */
  getChannelInfo() {
    throw new Error('Method getChannelInfo must be implemented by concrete bridge');
  }

  /**
   * Valida destinatário
   * @param {Object} recipient - Destinatário
   * @returns {boolean} True se válido
   */
  validateRecipient(recipient) {
    throw new Error('Method validateRecipient must be implemented by concrete bridge');
  }

  /**
   * Verifica saúde do bridge
   * @returns {Promise<Object>} Status de saúde
   */
  async healthCheck() {
    throw new Error('Method healthCheck must be implemented by concrete bridge');
  }
}

module.exports = INotificationBridge;
