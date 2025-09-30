/**
 * ProductHistory - Implementação de Memento Pattern para Produtos
 * 
 * Permite rastrear histórico de mudanças em produtos e fazer undo/redo.
 * Útil para auditoria e recuperação de dados.
 */

const Originator = require('../../domain/memento/Originator');
const Caretaker = require('../../domain/memento/Caretaker');
const { logger } = require('../../infra/logger');

class ProductHistory extends Originator {
  constructor(productData = {}) {
    super();
    this._state = productData;
    this._caretaker = new Caretaker(50); // Máximo 50 versões
    
    // Salva estado inicial
    if (Object.keys(productData).length > 0) {
      this.saveSnapshot('initial_state');
    }
  }

  /**
   * Atualiza produto e salva no histórico
   * @param {Object} changes - Mudanças a aplicar
   * @param {string} action - Descrição da ação
   */
  updateProduct(changes, action = 'update') {
    const previousState = { ...this._state };
    
    // Aplica mudanças
    this._state = { ...this._state, ...changes, updatedAt: new Date() };
    
    // Salva snapshot
    this.saveSnapshot(action, { previousState, changes });
    
    logger.info('[PRODUCT HISTORY] Produto atualizado', {
      productId: this._state.id,
      action,
      changes: Object.keys(changes)
    });
  }

  /**
   * Salva snapshot do estado atual
   * @param {string} action - Ação que gerou o snapshot
   * @param {Object} metadata - Metadata adicional
   */
  saveSnapshot(action, metadata = {}) {
    const memento = this.createMemento({
      action,
      productId: this._state.id,
      productName: this._state.name,
      ...metadata
    });
    
    this._caretaker.save(memento);
  }

  /**
   * Desfaz última mudança (undo)
   * @returns {Object|null} Estado restaurado ou null
   */
  undo() {
    const memento = this._caretaker.undo();
    
    if (memento) {
      this.restore(memento);
      logger.info('[PRODUCT HISTORY] Undo executado', {
        productId: this._state.id,
        restoredTo: memento.getMetadata().action
      });
      return this._state;
    }
    
    return null;
  }

  /**
   * Refaz mudança desfeita (redo)
   * @returns {Object|null} Estado restaurado ou null
   */
  redo() {
    const memento = this._caretaker.redo();
    
    if (memento) {
      this.restore(memento);
      logger.info('[PRODUCT HISTORY] Redo executado', {
        productId: this._state.id,
        restoredTo: memento.getMetadata().action
      });
      return this._state;
    }
    
    return null;
  }

  /**
   * Restaura para uma versão específica
   * @param {string} mementoId - ID do memento
   * @returns {Object|null} Estado restaurado ou null
   */
  restoreToVersion(mementoId) {
    const memento = this._caretaker.restoreById(mementoId);
    
    if (memento) {
      this.restore(memento);
      logger.info('[PRODUCT HISTORY] Restaurado para versão específica', {
        productId: this._state.id,
        mementoId
      });
      return this._state;
    }
    
    return null;
  }

  /**
   * Retorna histórico de mudanças
   * @returns {Array<Object>} Lista de versões
   */
  getHistory() {
    return this._caretaker.getHistoryWithMetadata();
  }

  /**
   * Retorna diferenças entre duas versões
   * @param {string} fromMementoId - Versão inicial
   * @param {string} toMementoId - Versão final
   * @returns {Object} Diferenças encontradas
   */
  getDiff(fromMementoId, toMementoId) {
    const fromMemento = this._caretaker.getById(fromMementoId);
    const toMemento = this._caretaker.getById(toMementoId);
    
    if (!fromMemento || !toMemento) {
      return null;
    }
    
    const fromState = fromMemento.getState();
    const toState = toMemento.getState();
    
    const diff = {};
    
    // Encontra campos modificados
    Object.keys(toState).forEach(key => {
      if (JSON.stringify(fromState[key]) !== JSON.stringify(toState[key])) {
        diff[key] = {
          from: fromState[key],
          to: toState[key]
        };
      }
    });
    
    return diff;
  }

  /**
   * Verifica se pode fazer undo
   * @returns {boolean} True se pode fazer undo
   */
  canUndo() {
    return this._caretaker.canUndo();
  }

  /**
   * Verifica se pode fazer redo
   * @returns {boolean} True se pode fazer redo
   */
  canRedo() {
    return this._caretaker.canRedo();
  }

  /**
   * Retorna estatísticas do histórico
   * @returns {Object} Estatísticas
   */
  getStats() {
    return this._caretaker.getStats();
  }

  /**
   * Limpa histórico
   */
  clearHistory() {
    this._caretaker.clear();
    logger.info('[PRODUCT HISTORY] Histórico limpo', {
      productId: this._state.id
    });
  }

  /**
   * Retorna produto atual
   * @returns {Object} Dados do produto
   */
  getProduct() {
    return this.getState();
  }
}

module.exports = ProductHistory;
