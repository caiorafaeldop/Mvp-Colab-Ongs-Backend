/**
 * Interface para Observers do padrão Observer
 * Define o contrato que todos os observers devem implementar
 */
class IObserver {
  /**
   * Método chamado quando um evento ocorre
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async update(event, context) {
    throw new Error('Method update() must be implemented');
  }

  /**
   * Verifica se o observer deve processar este evento
   * @param {Object} event - Dados do evento
   * @returns {boolean} True se deve processar
   */
  shouldHandle(event) {
    throw new Error('Method shouldHandle() must be implemented');
  }

  /**
   * Retorna o nome do observer
   * @returns {string} Nome do observer
   */
  getName() {
    throw new Error('Method getName() must be implemented');
  }

  /**
   * Retorna os tipos de eventos que este observer escuta
   * @returns {Array<string>} Lista de tipos de eventos
   */
  getEventTypes() {
    throw new Error('Method getEventTypes() must be implemented');
  }
}

module.exports = IObserver;
