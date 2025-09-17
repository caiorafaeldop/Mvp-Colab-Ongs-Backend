const CloudinaryAdapter = require('../../infra/adapters/CloudinaryAdapter');
const OpenAIAdapter = require('../../infra/adapters/OpenAIAdapter');
const AnthropicAdapter = require('../../infra/adapters/AnthropicAdapter');

/**
 * Factory para criação de adapters
 * Centraliza a criação de diferentes tipos de adapters seguindo o padrão Factory
 */
class AdapterFactory {
  /**
   * Cria um adapter de LLM baseado no provedor
   * @param {string} provider - Nome do provedor ('openai' ou 'anthropic')
   * @returns {ILLMAdapter} Instância do adapter
   */
  static createLLMAdapter(provider) {
    switch (provider.toLowerCase()) {
      case 'openai':
        return new OpenAIAdapter();
      case 'anthropic':
        return new AnthropicAdapter();
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
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
   * Cria um adapter de LLM baseado em variável de ambiente
   * @returns {ILLMAdapter} Instância do adapter configurado
   */
  static createDefaultLLMAdapter() {
    const defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'openai';
    return this.createLLMAdapter(defaultProvider);
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
