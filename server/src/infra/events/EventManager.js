const ISubject = require('../../domain/observers/ISubject');

/**
 * Gerenciador central de eventos e observers
 * Implementa o padrão Observer como Subject principal
 */
class EventManager extends ISubject {
  constructor() {
    super();
    this.observers = [];
    this.eventHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Adiciona um observer
   * @param {IObserver} observer - Observer a ser adicionado
   */
  addObserver(observer) {
    if (!this.observers.find(obs => obs.getName() === observer.getName())) {
      this.observers.push(observer);
      console.log(`[EventManager] Observer adicionado: ${observer.getName()}`);
    }
  }

  /**
   * Remove um observer
   * @param {IObserver} observer - Observer a ser removido
   */
  removeObserver(observer) {
    const index = this.observers.findIndex(obs => obs.getName() === observer.getName());
    if (index > -1) {
      this.observers.splice(index, 1);
      console.log(`[EventManager] Observer removido: ${observer.getName()}`);
    }
  }

  /**
   * Remove observer por nome
   * @param {string} observerName - Nome do observer
   */
  removeObserverByName(observerName) {
    const index = this.observers.findIndex(obs => obs.getName() === observerName);
    if (index > -1) {
      this.observers.splice(index, 1);
      console.log(`[EventManager] Observer removido: ${observerName}`);
    }
  }

  /**
   * Notifica todos os observers relevantes
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async notifyObservers(event, context = {}) {
    try {
      // Adiciona timestamp e ID único ao evento
      const enrichedEvent = {
        ...event,
        id: this.generateEventId(),
        timestamp: new Date(),
        context
      };

      // Adiciona ao histórico
      this.addToHistory(enrichedEvent);

      console.log(`[EventManager] Notificando evento: ${event.type}`);

      // Notifica observers relevantes em paralelo
      const notifications = this.observers
        .filter(observer => observer.shouldHandle(enrichedEvent))
        .map(async observer => {
          try {
            await observer.update(enrichedEvent, context);
            console.log(`[EventManager] Observer ${observer.getName()} processou evento ${event.type}`);
          } catch (error) {
            console.error(`[EventManager] Erro no observer ${observer.getName()}:`, error.message);
          }
        });

      await Promise.all(notifications);
    } catch (error) {
      console.error('[EventManager] Erro ao notificar observers:', error.message);
    }
  }

  /**
   * Emite um evento específico
   * @param {string} eventType - Tipo do evento
   * @param {Object} data - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async emit(eventType, data = {}, context = {}) {
    const event = {
      type: eventType,
      data,
      source: context.source || 'system'
    };

    await this.notifyObservers(event, context);
  }

  /**
   * Retorna a lista de observers
   * @returns {Array<IObserver>} Lista de observers
   */
  getObservers() {
    return [...this.observers];
  }

  /**
   * Retorna observers por tipo de evento
   * @param {string} eventType - Tipo do evento
   * @returns {Array<IObserver>} Lista de observers que escutam este evento
   */
  getObserversByEventType(eventType) {
    return this.observers.filter(observer => 
      observer.getEventTypes().includes(eventType)
    );
  }

  /**
   * Retorna o histórico de eventos
   * @param {number} limit - Limite de eventos a retornar
   * @returns {Array<Object>} Histórico de eventos
   */
  getEventHistory(limit = 50) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Retorna estatísticas dos eventos
   * @returns {Object} Estatísticas
   */
  getEventStats() {
    const stats = {
      totalEvents: this.eventHistory.length,
      observersCount: this.observers.length,
      eventTypes: {},
      recentEvents: this.eventHistory.slice(-10)
    };

    // Conta eventos por tipo
    this.eventHistory.forEach(event => {
      stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Limpa o histórico de eventos
   */
  clearHistory() {
    this.eventHistory = [];
    console.log('[EventManager] Histórico de eventos limpo');
  }

  /**
   * Adiciona evento ao histórico
   * @param {Object} event - Evento a ser adicionado
   */
  addToHistory(event) {
    this.eventHistory.push(event);
    
    // Mantém o tamanho do histórico limitado
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Gera ID único para evento
   * @returns {string} ID único
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verifica se um observer está registrado
   * @param {string} observerName - Nome do observer
   * @returns {boolean} True se estiver registrado
   */
  hasObserver(observerName) {
    return this.observers.some(obs => obs.getName() === observerName);
  }
}

// Singleton instance
let instance = null;

/**
 * Retorna a instância singleton do EventManager
 * @returns {EventManager} Instância única
 */
function getInstance() {
  if (!instance) {
    instance = new EventManager();
  }
  return instance;
}

module.exports = { EventManager, getInstance };
