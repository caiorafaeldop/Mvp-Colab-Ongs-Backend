/**
 * ORIGINATOR (Memento Pattern)
 * 
 * Classe base para objetos que podem ter seu estado salvo/restaurado.
 * Implementa createMemento() e restore().
 */

const Memento = require('./Memento');

class Originator {
  constructor() {
    this._state = {};
  }

  /**
   * Define o estado atual
   * @param {Object} state - Novo estado
   */
  setState(state) {
    this._state = { ...state };
  }

  /**
   * Retorna o estado atual
   * @returns {Object} Estado atual
   */
  getState() {
    return { ...this._state };
  }

  /**
   * Cria um memento do estado atual
   * @param {Object} metadata - Metadata opcional
   * @returns {Memento} Novo memento
   */
  createMemento(metadata = {}) {
    return new Memento(this._state, {
      ...metadata,
      originatorType: this.constructor.name
    });
  }

  /**
   * Restaura estado de um memento
   * @param {Memento} memento - Memento a ser restaurado
   */
  restore(memento) {
    this._state = memento.getState();
  }

  /**
   * Retorna representação string do originator
   * @returns {string} Descrição
   */
  toString() {
    return `${this.constructor.name}[State: ${JSON.stringify(this._state)}]`;
  }
}

module.exports = Originator;
