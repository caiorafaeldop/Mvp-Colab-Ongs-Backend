/**
 * CARETAKER (Memento Pattern)
 *
 * Gerencia histórico de mementos.
 * Responsável por armazenar e recuperar snapshots.
 * Implementa undo/redo com limite de histórico.
 */

const { logger } = require('../../infra/logger');

class Caretaker {
  constructor(maxHistorySize = 50) {
    this._history = [];
    this._currentIndex = -1;
    this._maxHistorySize = maxHistorySize;
  }

  /**
   * Salva um novo memento no histórico
   * @param {Memento} memento - Memento a ser salvo
   */
  save(memento) {
    // Remove todos os mementos após o índice atual (para redo após undo)
    if (this._currentIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._currentIndex + 1);
    }

    // Adiciona novo memento
    this._history.push(memento);
    this._currentIndex++;

    // Limita tamanho do histórico
    if (this._history.length > this._maxHistorySize) {
      this._history.shift();
      this._currentIndex--;
    }

    logger.debug('[CARETAKER] Memento salvo', {
      mementoId: memento.getId(),
      historySize: this._history.length,
      currentIndex: this._currentIndex,
    });
  }

  /**
   * Retorna memento anterior (undo)
   * @returns {Memento|null} Memento anterior ou null
   */
  undo() {
    if (!this.canUndo()) {
      logger.warn('[CARETAKER] Não é possível fazer undo');
      return null;
    }

    this._currentIndex--;
    const memento = this._history[this._currentIndex];

    logger.info('[CARETAKER] Undo executado', {
      mementoId: memento.getId(),
      newIndex: this._currentIndex,
    });

    return memento;
  }

  /**
   * Retorna próximo memento (redo)
   * @returns {Memento|null} Próximo memento ou null
   */
  redo() {
    if (!this.canRedo()) {
      logger.warn('[CARETAKER] Não é possível fazer redo');
      return null;
    }

    this._currentIndex++;
    const memento = this._history[this._currentIndex];

    logger.info('[CARETAKER] Redo executado', {
      mementoId: memento.getId(),
      newIndex: this._currentIndex,
    });

    return memento;
  }

  /**
   * Verifica se pode fazer undo
   * @returns {boolean} True se pode fazer undo
   */
  canUndo() {
    return this._currentIndex > 0;
  }

  /**
   * Verifica se pode fazer redo
   * @returns {boolean} True se pode fazer redo
   */
  canRedo() {
    return this._currentIndex < this._history.length - 1;
  }

  /**
   * Retorna memento atual
   * @returns {Memento|null} Memento atual ou null
   */
  getCurrent() {
    if (this._currentIndex < 0 || this._currentIndex >= this._history.length) {
      return null;
    }
    return this._history[this._currentIndex];
  }

  /**
   * Retorna todo o histórico
   * @returns {Array<Memento>} Lista de mementos
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Retorna histórico com metadata
   * @returns {Array<Object>} Histórico com informações
   */
  getHistoryWithMetadata() {
    return this._history.map((memento, index) => ({
      id: memento.getId(),
      timestamp: memento.getTimestamp(),
      metadata: memento.getMetadata(),
      isCurrent: index === this._currentIndex,
    }));
  }

  /**
   * Limpa todo o histórico
   */
  clear() {
    this._history = [];
    this._currentIndex = -1;
    logger.info('[CARETAKER] Histórico limpo');
  }

  /**
   * Retorna estatísticas do histórico
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      historySize: this._history.length,
      currentIndex: this._currentIndex,
      maxHistorySize: this._maxHistorySize,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoAvailable: this._currentIndex,
      redoAvailable: this._history.length - this._currentIndex - 1,
    };
  }

  /**
   * Retorna memento por ID
   * @param {string} mementoId - ID do memento
   * @returns {Memento|null} Memento encontrado ou null
   */
  getById(mementoId) {
    return this._history.find((m) => m.getId() === mementoId) || null;
  }

  /**
   * Restaura para um memento específico por ID
   * @param {string} mementoId - ID do memento
   * @returns {Memento|null} Memento restaurado ou null
   */
  restoreById(mementoId) {
    const index = this._history.findIndex((m) => m.getId() === mementoId);

    if (index === -1) {
      logger.warn('[CARETAKER] Memento não encontrado', { mementoId });
      return null;
    }

    this._currentIndex = index;
    const memento = this._history[index];

    logger.info('[CARETAKER] Restaurado para memento específico', {
      mementoId,
      newIndex: this._currentIndex,
    });

    return memento;
  }
}

module.exports = Caretaker;
