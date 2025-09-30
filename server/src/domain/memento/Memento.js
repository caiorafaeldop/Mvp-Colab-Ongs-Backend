/**
 * MEMENTO PATTERN (Comportamental)
 *
 * Memento: Armazena o estado interno de um objeto sem violar encapsulamento.
 * Permite restaurar o objeto a um estado anterior (undo/redo).
 *
 * Componentes:
 * - Memento: Armazena snapshot do estado
 * - Originator: Objeto cujo estado é salvo
 * - Caretaker: Gerencia histórico de mementos
 */

class Memento {
  constructor(state, metadata = {}) {
    this._state = state;
    this._timestamp = new Date();
    this._metadata = metadata;
    this._id = this._generateId();
  }

  /**
   * Retorna o estado armazenado
   * @returns {Object} Estado do objeto
   */
  getState() {
    return JSON.parse(JSON.stringify(this._state)); // Deep clone
  }

  /**
   * Retorna timestamp da criação
   * @returns {Date} Timestamp
   */
  getTimestamp() {
    return this._timestamp;
  }

  /**
   * Retorna metadata do memento
   * @returns {Object} Metadata
   */
  getMetadata() {
    return this._metadata;
  }

  /**
   * Retorna ID único do memento
   * @returns {string} ID
   */
  getId() {
    return this._id;
  }

  /**
   * Gera ID único para o memento
   * @private
   */
  _generateId() {
    return `memento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Retorna representação string do memento
   * @returns {string} Descrição
   */
  toString() {
    return `Memento[${this._id}] at ${this._timestamp.toISOString()}`;
  }
}

module.exports = Memento;
