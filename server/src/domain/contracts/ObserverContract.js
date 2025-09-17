/**
 * Interface base para observers
 * Define o contrato padrão que todos os observers devem seguir
 */
class IObserver {
  /**
   * Método chamado quando um evento é notificado
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   * @returns {Promise<void>}
   */
  async update(event, context = {}) {
    throw new Error('Method update must be implemented by concrete observer');
  }

  /**
   * Retorna o nome do observer
   * @returns {string} Nome do observer
   */
  getName() {
    throw new Error('Method getName must be implemented by concrete observer');
  }

  /**
   * Retorna os tipos de evento que este observer escuta
   * @returns {Array<string>} Lista de tipos de evento
   */
  getEventTypes() {
    throw new Error('Method getEventTypes must be implemented by concrete observer');
  }

  /**
   * Verifica se o observer deve processar este evento
   * @param {Object} event - Dados do evento
   * @returns {boolean} True se deve processar
   */
  shouldHandle(event) {
    return this.getEventTypes().includes(event.type);
  }
}

module.exports = IObserver;
