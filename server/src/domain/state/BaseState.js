/**
 * Base State Pattern com FSM (Finite State Machine)
 * Define estrutura comum para todos os estados do sistema
 */
class BaseState {
  constructor(currentState, transitions = {}) {
    this.currentState = currentState;
    this.transitions = transitions; // Mapa de transições válidas
    this.history = []; // Histórico de transições
    this.metadata = {}; // Metadados adicionais
  }

  /**
   * Valida se transição é permitida
   * @param {string} targetState - Estado alvo
   * @returns {boolean}
   */
  canTransitionTo(targetState) {
    const allowedTransitions = this.transitions[this.currentState] || [];
    return allowedTransitions.includes(targetState);
  }

  /**
   * Executa transição para novo estado
   * @param {string} targetState - Estado alvo
   * @param {Object} metadata - Metadados da transição
   * @returns {BaseState} Nova instância com novo estado
   */
  transitionTo(targetState, metadata = {}) {
    if (!this.canTransitionTo(targetState)) {
      throw new Error(
        `Invalid transition: ${this.currentState} -> ${targetState}. ` +
          `Allowed: [${this.transitions[this.currentState]?.join(', ') || 'none'}]`
      );
    }

    const newState = this.clone();
    newState.currentState = targetState;
    newState.history.push({
      from: this.currentState,
      to: targetState,
      timestamp: new Date().toISOString(),
      metadata,
    });
    newState.metadata = { ...newState.metadata, ...metadata };

    return newState;
  }

  /**
   * Retorna estado atual
   * @returns {string}
   */
  getState() {
    return this.currentState;
  }

  /**
   * Retorna todas as transições possíveis do estado atual
   * @returns {Array<string>}
   */
  getAvailableTransitions() {
    return this.transitions[this.currentState] || [];
  }

  /**
   * Retorna histórico de transições
   * @returns {Array}
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Verifica se está em determinado estado
   * @param {string} state
   * @returns {boolean}
   */
  is(state) {
    return this.currentState === state;
  }

  /**
   * Verifica se está em um dos estados fornecidos
   * @param {Array<string>} states
   * @returns {boolean}
   */
  isOneOf(states) {
    return states.includes(this.currentState);
  }

  /**
   * Clona o estado (deve ser sobrescrito)
   * @returns {BaseState}
   */
  clone() {
    const cloned = new this.constructor(this.currentState);
    cloned.history = [...this.history];
    cloned.metadata = { ...this.metadata };
    return cloned;
  }

  /**
   * Serializa para JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      currentState: this.currentState,
      availableTransitions: this.getAvailableTransitions(),
      history: this.history,
      metadata: this.metadata,
    };
  }
}

module.exports = BaseState;
