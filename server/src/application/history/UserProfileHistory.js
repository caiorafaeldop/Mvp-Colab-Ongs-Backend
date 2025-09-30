/**
 * UserProfileHistory - Memento Pattern para perfis de usuário
 * 
 * Rastreia mudanças no perfil do usuário com undo/redo.
 * Útil para recuperar dados apagados acidentalmente.
 */

const Originator = require('../../domain/memento/Originator');
const Caretaker = require('../../domain/memento/Caretaker');
const { logger } = require('../../infra/logger');

class UserProfileHistory extends Originator {
  constructor(userData = {}) {
    super();
    this._state = userData;
    this._caretaker = new Caretaker(30); // Máximo 30 versões
    
    if (Object.keys(userData).length > 0) {
      this.saveSnapshot('profile_created');
    }
  }

  /**
   * Atualiza perfil e salva no histórico
   * @param {Object} changes - Mudanças no perfil
   * @param {string} action - Ação realizada
   */
  updateProfile(changes, action = 'profile_updated') {
    const previousState = { ...this._state };
    
    // Não salva password no histórico
    const sanitizedChanges = { ...changes };
    if ('password' in sanitizedChanges) {
      sanitizedChanges.password = '***HIDDEN***';
    }
    
    this._state = { ...this._state, ...changes, updatedAt: new Date() };
    
    this.saveSnapshot(action, { 
      previousState: this._sanitizeState(previousState), 
      changes: sanitizedChanges 
    });
    
    logger.info('[USER PROFILE HISTORY] Perfil atualizado', {
      userId: this._state.id,
      action,
      fields: Object.keys(changes)
    });
  }

  /**
   * Salva snapshot do perfil
   * @param {string} action - Ação realizada
   * @param {Object} metadata - Metadata
   */
  saveSnapshot(action, metadata = {}) {
    const sanitizedState = this._sanitizeState(this._state);
    
    const memento = new (require('../../domain/memento/Memento'))(sanitizedState, {
      action,
      userId: this._state.id,
      email: this._state.email,
      ...metadata
    });
    
    this._caretaker.save(memento);
  }

  /**
   * Remove campos sensíveis do estado
   * @private
   */
  _sanitizeState(state) {
    const sanitized = { ...state };
    if ('password' in sanitized) {
      delete sanitized.password;
    }
    if ('accessToken' in sanitized) {
      delete sanitized.accessToken;
    }
    if ('refreshToken' in sanitized) {
      delete sanitized.refreshToken;
    }
    return sanitized;
  }

  /**
   * Desfaz última mudança
   * @returns {Object|null} Perfil restaurado
   */
  undo() {
    const memento = this._caretaker.undo();
    
    if (memento) {
      this.restore(memento);
      logger.info('[USER PROFILE HISTORY] Undo executado', {
        userId: this._state.id
      });
      return this._state;
    }
    
    return null;
  }

  /**
   * Refaz mudança desfeita
   * @returns {Object|null} Perfil restaurado
   */
  redo() {
    const memento = this._caretaker.redo();
    
    if (memento) {
      this.restore(memento);
      logger.info('[USER PROFILE HISTORY] Redo executado', {
        userId: this._state.id
      });
      return this._state;
    }
    
    return null;
  }

  /**
   * Retorna histórico de mudanças no perfil
   * @returns {Array<Object>} Histórico
   */
  getHistory() {
    return this._caretaker.getHistoryWithMetadata();
  }

  /**
   * Retorna auditoria de mudanças
   * @returns {Array<Object>} Auditoria formatada
   */
  getAudit() {
    const history = this.getHistory();
    
    return history.map(entry => ({
      timestamp: entry.timestamp,
      action: entry.metadata.action,
      changes: entry.metadata.changes ? Object.keys(entry.metadata.changes) : [],
      isCurrent: entry.isCurrent
    }));
  }

  /**
   * Verifica se pode fazer undo
   */
  canUndo() {
    return this._caretaker.canUndo();
  }

  /**
   * Verifica se pode fazer redo
   */
  canRedo() {
    return this._caretaker.canRedo();
  }

  /**
   * Retorna perfil atual
   */
  getProfile() {
    return this.getState();
  }

  /**
   * Limpa histórico
   */
  clearHistory() {
    this._caretaker.clear();
    logger.info('[USER PROFILE HISTORY] Histórico limpo', {
      userId: this._state.id
    });
  }
}

module.exports = UserProfileHistory;
