const CloudinaryAdapter = require('../../infra/adapters/CloudinaryAdapter');
const SimpleMercadoPagoAdapter = require('../../infra/adapters/SimpleMercadoPagoAdapter');
const WhatsAppUtils = require('../../infra/adapters/WhatsAppUtils');

/**
 * Factory para criação de adapters
 * Centraliza a criação de diferentes tipos de adapters seguindo o padrão Factory
 */
class AdapterFactory {
  /**
   * Cria um adapter de pagamento
   * @param {string} provider - Nome do provedor (padrão: 'mercadopago')
   * @returns {PaymentAdapter} Instância do adapter
   */
  static createPaymentAdapter(provider = 'mercadopago') {
    switch (provider.toLowerCase()) {
      case 'mercadopago':
        return new SimpleMercadoPagoAdapter();
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Cria um adapter de storage baseado no provedor
   * @param {string} provider - Nome do provedor (padrão: 'cloudinary')
   * @returns {IStorageAdapter} Instância do adapter
   */
  static createStorageAdapter(provider = 'cloudinary') {
    switch (provider.toLowerCase()) {
      case 'cloudinary':
        return new CloudinaryAdapter();
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }

  /**
   * Cria utils do WhatsApp
   * @returns {WhatsAppUtils} Instância dos utils
   */
  static createWhatsAppUtils() {
    return new WhatsAppUtils();
  }

  /**
   * Cria um adapter de storage baseado em variável de ambiente
   * @returns {IStorageAdapter} Instância do adapter configurado
   */
  static createDefaultStorageAdapter() {
    const defaultProvider = process.env.DEFAULT_STORAGE_PROVIDER || 'cloudinary';
    return this.createStorageAdapter(defaultProvider);
  }

  /**
   * Lista todos os provedores LLM disponíveis
   * @returns {Array<string>} Lista de provedores
   */
  static getAvailableLLMProviders() {
    return ['openai', 'anthropic'];
  }

  /**
   * Lista todos os provedores de storage disponíveis
   * @returns {Array<string>} Lista de provedores
   */
  static getAvailableStorageProviders() {
    return ['cloudinary'];
  }
}

module.exports = AdapterFactory;
