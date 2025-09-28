/**
 * Interface para subjects (observáveis)
 * Define o contrato para objetos que podem ser observados
 */
class ISubject {
  /**
   * Adiciona um observer
   * @param {IObserver} observer - Observer a ser adicionado
   * @returns {void}
   */
  addObserver(observer) {
    throw new Error('Method addObserver must be implemented by concrete subject');
  }

  /**
   * Remove um observer
   * @param {IObserver} observer - Observer a ser removido
   * @returns {void}
   */
  removeObserver(observer) {
    throw new Error('Method removeObserver must be implemented by concrete subject');
  }

  /**
   * Notifica todos os observers
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   * @returns {Promise<void>}
   */
  async notifyObservers(event, context = {}) {
    throw new Error('Method notifyObservers must be implemented by concrete subject');
  }

  /**
   * Retorna a lista de observers
   * @returns {Array<IObserver>} Lista de observers
   */
  getObservers() {
    throw new Error('Method getObservers must be implemented by concrete subject');
  }
}

module.exports = ISubject;
