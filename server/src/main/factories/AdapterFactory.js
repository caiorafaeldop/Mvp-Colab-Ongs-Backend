const CloudinaryAdapter = require('../../infra/adapters/CloudinaryAdapter');
const SimpleMercadoPagoAdapter = require('../../infra/adapters/SimpleMercadoPagoAdapter');
const MockMercadoPagoAdapter = require('../../infra/adapters/MockMercadoPagoAdapter');
const WhatsAppUtils = require('../../infra/adapters/WhatsAppUtils');
const { logger } = require('../../infra/logger');

/**
 * Factory para criação de adapters
 * Centraliza a criação de diferentes tipos de adapters seguindo o padrão Factory
 */
class AdapterFactory {
  /**
   * Determina o modo de operação do Mercado Pago
   * @returns {string} 'mock', 'test' ou 'prod'
   */
  static getMercadoPagoMode() {
    // Novo sistema de modos
    const mode = process.env.MERCADO_PAGO_MODE || 'test';

    // Compatibilidade com sistema antigo
    if (process.env.MOCK_MERCADO_PAGO === 'true') {
      return 'mock';
    }

    return mode.toLowerCase();
  }

  /**
   * Obtém as credenciais corretas baseado no modo
   * @param {string} mode - 'mock', 'test' ou 'prod'
   * @returns {object} Objeto com accessToken e publicKey
   */
  static getMercadoPagoCredentials(mode) {
    switch (mode) {
      case 'test':
        return {
          accessToken:
            process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN,
          publicKey:
            process.env.MERCADO_PAGO_TEST_PUBLIC_KEY || process.env.MERCADO_PAGO_PUBLIC_KEY,
          mode: 'test',
        };

      case 'prod':
        return {
          accessToken: process.env.MERCADO_PAGO_PROD_ACCESS_TOKEN,
          publicKey: process.env.MERCADO_PAGO_PROD_PUBLIC_KEY,
          clientId: process.env.MERCADO_PAGO_PROD_CLIENT_ID,
          clientSecret: process.env.MERCADO_PAGO_PROD_CLIENT_SECRET,
          mode: 'prod',
        };

      case 'mock':
      default:
        return {
          accessToken: 'MOCK_TOKEN',
          publicKey: 'MOCK_PUBLIC_KEY',
          mode: 'mock',
        };
    }
  }

  /**
   * Cria um adapter de pagamento com sistema de modos
   * @param {string} provider - Nome do provedor (padrão: 'mercadopago')
   * @returns {PaymentAdapter} Instância do adapter
   */
  static createPaymentAdapter(provider = 'mercadopago', options = {}) {
    const mode = this.getMercadoPagoMode();

    logger.info('[ADAPTER FACTORY] ====================================');
    logger.info('[ADAPTER FACTORY] Criando Payment Adapter');
    logger.info('[ADAPTER FACTORY] Provedor:', provider);
    logger.info('[ADAPTER FACTORY] Modo:', mode.toUpperCase());

    // Modo MOCK - Simulação completa
    if (mode === 'mock') {
      logger.warn('[ADAPTER FACTORY] ⚠️  MODO MOCK ATIVADO');
      logger.warn('[ADAPTER FACTORY] ⚠️  Simulação completa - Nenhuma chamada real!');
      logger.warn('[ADAPTER FACTORY] ⚠️  Útil para: desenvolvimento rápido, CI/CD, demos');
      logger.info('[ADAPTER FACTORY] ====================================');
      return new MockMercadoPagoAdapter();
    }

    // Modos TEST e PROD - Mercado Pago real
    switch (provider.toLowerCase()) {
      case 'mercadopago': {
        const credentials = this.getMercadoPagoCredentials(mode);

        if (!credentials.accessToken || credentials.accessToken === 'TEST-TOKEN') {
          logger.error('[ADAPTER FACTORY] ❌ CREDENCIAIS INVÁLIDAS!');
          logger.error('[ADAPTER FACTORY] Verifique o .env');
          throw new Error('Mercado Pago: Credenciais não configuradas');
        }

        if (mode === 'test') {
          logger.info('[ADAPTER FACTORY] 🧪 MODO TESTE');
          logger.info('[ADAPTER FACTORY] ✅ Usa API real do Mercado Pago');
          logger.info('[ADAPTER FACTORY] ✅ NÃO cobra dinheiro real');
          logger.info('[ADAPTER FACTORY] ✅ Permite debugar erros reais da API');
        } else if (mode === 'prod') {
          logger.warn('[ADAPTER FACTORY] 💰 MODO PRODUÇÃO');
          logger.warn('[ADAPTER FACTORY] ⚠️  USA API REAL DO MERCADO PAGO');
          logger.warn('[ADAPTER FACTORY] ⚠️  COBRA DINHEIRO REAL!');
          logger.warn('[ADAPTER FACTORY] ⚠️  Certifique-se que está pronto!');
        }

        logger.info('[ADAPTER FACTORY] Token:', credentials.accessToken.substring(0, 30) + '...');
        logger.info('[ADAPTER FACTORY] ====================================');

        const adapter = new SimpleMercadoPagoAdapter(credentials.accessToken, {
          ...options,
          publicKey: credentials.publicKey,
          mode: credentials.mode,
        });

        try {
          if (!adapter.validateConfiguration()) {
            logger.warn('[ADAPTER FACTORY] ⚠️  Configuração pode estar incompleta');
          }
        } catch (_) {}

        return adapter;
      }
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
    const adapter = this.createStorageAdapter(defaultProvider);
    try {
      if (!adapter.validateConfiguration()) {
        logger.warn('[ADAPTER FACTORY] Storage adapter com configuração inválida');
      }
    } catch (_) {}
    return adapter;
  }

  /**
   * Lista todos os provedores LLM disponíveis
   * @returns {Array<string>} Lista de provedores
   */
  static getAvailableLLMProviders() {
    return ['openai', 'anthropic'];
  }

  /**
   * Lista provedores de pagamento disponíveis
   */
  static getAvailablePaymentProviders() {
    return ['mercadopago'];
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
