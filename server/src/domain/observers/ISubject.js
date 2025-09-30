/**
 * Interface para Subjects do padrão Observer
 * Define o contrato para objetos que notificam observers
 */
class ISubject {
  /**
   * Adiciona um observer
   * @param {IObserver} observer - Observer a ser adicionado
   */
  addObserver(observer) {
    throw new Error('Method addObserver() must be implemented');
  }

  /**
   * Remove um observer
   * @param {IObserver} observer - Observer a ser removido
   */
  removeObserver(observer) {
    throw new Error('Method removeObserver() must be implemented');
  }

  /**
   * Notifica todos os observers
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async notifyObservers(event, context) {
    throw new Error('Method notifyObservers() must be implemented');
  }
}

module.exports = ISubject;
