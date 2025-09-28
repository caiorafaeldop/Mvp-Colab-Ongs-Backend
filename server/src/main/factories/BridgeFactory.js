const CloudinaryStorageBridge = require('../../infra/bridges/CloudinaryStorageBridge');
const LocalStorageBridge = require('../../infra/bridges/LocalStorageBridge');
const EmailNotificationBridge = require('../../infra/bridges/EmailNotificationBridge');
const WhatsAppNotificationBridge = require('../../infra/bridges/WhatsAppNotificationBridge');

/**
 * Factory para criação e configuração de bridges
 * Centraliza a criação de todos os bridges do sistema
 */
class BridgeFactory {
  constructor() {
    this.bridges = new Map();
  }

  /**
   * Inicializa todos os bridges do sistema
   * @param {Object} dependencies - Dependências necessárias
   * @returns {Object} Bridges configurados
   */
  static async initialize(dependencies = {}) {
    const factory = new BridgeFactory();
    return await factory.setupBridges(dependencies);
  }

  /**
   * Configura todos os bridges do sistema
   * @param {Object} dependencies - Dependências necessárias
   * @returns {Object} Bridges configurados
   */
  async setupBridges(dependencies) {
    try {
      console.log('[BridgeFactory] Configurando bridges do sistema...');

      // Cria storage bridges
      await this.createStorageBridges(dependencies);
      
      // Cria notification bridges
      await this.createNotificationBridges(dependencies);

      console.log(`[BridgeFactory] ${this.bridges.size} bridges criados com sucesso`);

      return {
        storage: {
          cloudinary: this.bridges.get('cloudinary-storage'),
          local: this.bridges.get('local-storage')
        },
        notification: {
          email: this.bridges.get('email-notification'),
          whatsapp: this.bridges.get('whatsapp-notification')
        }
      };
    } catch (error) {
      console.error('[BridgeFactory] Erro ao configurar bridges:', error.message);
      throw error;
    }
  }

  /**
   * Cria Storage Bridges
   * @param {Object} dependencies - Dependências necessárias
   */
  async createStorageBridges(dependencies) {
    try {
      // Cloudinary Storage Bridge
      if (dependencies.cloudinaryAdapter) {
        const cloudinaryBridge = new CloudinaryStorageBridge(dependencies.cloudinaryAdapter);
        this.bridges.set('cloudinary-storage', cloudinaryBridge);
        console.log('[BridgeFactory] CloudinaryStorageBridge criado');
      } else {
        console.warn('[BridgeFactory] CloudinaryAdapter não fornecido para CloudinaryStorageBridge');
      }

      // Local Storage Bridge
      const localBridge = new LocalStorageBridge(dependencies.localStoragePath);
      this.bridges.set('local-storage', localBridge);
      console.log('[BridgeFactory] LocalStorageBridge criado');

    } catch (error) {
      console.error('[BridgeFactory] Erro ao criar Storage Bridges:', error.message);
    }
  }

  /**
   * Cria Notification Bridges
   * @param {Object} dependencies - Dependências necessárias
   */
  async createNotificationBridges(dependencies) {
    try {
      // Email Notification Bridge
      if (dependencies.emailAdapter) {
        const emailBridge = new EmailNotificationBridge(dependencies.emailAdapter);
        this.bridges.set('email-notification', emailBridge);
        console.log('[BridgeFactory] EmailNotificationBridge criado');
      } else {
        console.warn('[BridgeFactory] EmailAdapter não fornecido para EmailNotificationBridge');
      }

      // WhatsApp Notification Bridge
      if (dependencies.whatsappAdapter) {
        const whatsappBridge = new WhatsAppNotificationBridge(dependencies.whatsappAdapter);
        this.bridges.set('whatsapp-notification', whatsappBridge);
        console.log('[BridgeFactory] WhatsAppNotificationBridge criado');
      } else {
        console.warn('[BridgeFactory] WhatsAppAdapter não fornecido para WhatsAppNotificationBridge');
      }

    } catch (error) {
      console.error('[BridgeFactory] Erro ao criar Notification Bridges:', error.message);
    }
  }

  /**
   * Obtém bridge por nome
   * @param {string} name - Nome do bridge
   * @returns {Object|null} Bridge encontrado
   */
  getBridge(name) {
    return this.bridges.get(name) || null;
  }

  /**
   * Obtém storage bridge preferido
   * @param {string} preference - Preferência ('cloudinary' ou 'local')
   * @returns {Object} Storage bridge
   */
  getStorageBridge(preference = 'cloudinary') {
    const bridgeName = `${preference}-storage`;
    const bridge = this.bridges.get(bridgeName);
    
    if (!bridge && preference === 'cloudinary') {
      // Fallback para local se Cloudinary não disponível
      console.warn('[BridgeFactory] Cloudinary não disponível, usando Local Storage');
      return this.bridges.get('local-storage');
    }
    
    return bridge;
  }

  /**
   * Obtém notification bridge preferido
   * @param {string} preference - Preferência ('email' ou 'whatsapp')
   * @returns {Object} Notification bridge
   */
  getNotificationBridge(preference = 'email') {
    const bridgeName = `${preference}-notification`;
    return this.bridges.get(bridgeName);
  }

  /**
   * Lista todos os bridges
   * @returns {Array<Object>} Lista de bridges
   */
  listBridges() {
    const bridgeList = [];
    
    for (const [name, bridge] of this.bridges) {
      const info = bridge.getProviderInfo?.() || bridge.getChannelInfo?.() || {};
      
      bridgeList.push({
        name: name,
        className: bridge.constructor.name,
        type: info.type || 'unknown',
        features: info.features || [],
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(bridge))
          .filter(method => method !== 'constructor' && typeof bridge[method] === 'function')
      });
    }

    return bridgeList;
  }

  /**
   * Obtém estatísticas dos bridges
   * @returns {Object} Estatísticas
   */
  getBridgeStats() {
    return {
      totalBridges: this.bridges.size,
      bridges: this.listBridges()
    };
  }

  /**
   * Testa conectividade de todos os bridges
   * @returns {Promise<Object>} Resultado dos testes
   */
  async healthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      bridges: {}
    };

    try {
      for (const [name, bridge] of this.bridges) {
        try {
          let status = 'healthy';
          let details = {};

          // Testa storage bridges
          if (name.includes('storage')) {
            if (bridge.getUsageStats) {
              details = await bridge.getUsageStats();
            }
            details.providerInfo = bridge.getProviderInfo();
          }

          // Testa notification bridges
          if (name.includes('notification')) {
            details.channelInfo = bridge.getChannelInfo();
          }

          results.bridges[name] = {
            status,
            details
          };

        } catch (error) {
          results.bridges[name] = {
            status: 'error',
            error: error.message
          };
          results.overall = 'degraded';
        }
      }

    } catch (error) {
      results.overall = 'error';
      results.error = error.message;
    }

    return results;
  }

  /**
   * Obtém bridge por tipo e funcionalidade
   * @param {string} type - Tipo do bridge ('storage' ou 'notification')
   * @param {Array} requiredFeatures - Funcionalidades necessárias
   * @returns {Array<Object>} Bridges compatíveis
   */
  findBridgesByFeatures(type, requiredFeatures = []) {
    const compatibleBridges = [];

    for (const [name, bridge] of this.bridges) {
      if (!name.includes(type)) continue;

      const info = bridge.getProviderInfo?.() || bridge.getChannelInfo?.() || {};
      const features = info.features || [];

      const hasAllFeatures = requiredFeatures.every(feature => 
        features.includes(feature)
      );

      if (hasAllFeatures) {
        compatibleBridges.push({
          name,
          bridge,
          info,
          score: features.length // Prioriza bridges com mais funcionalidades
        });
      }
    }

    // Ordena por score (mais funcionalidades primeiro)
    return compatibleBridges.sort((a, b) => b.score - a.score);
  }
}

module.exports = BridgeFactory;
