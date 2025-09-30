const BaseState = require('./BaseState');

/**
 * Collaboration State - Gerencia estados de colaborações entre ONGs
 */
class CollaborationState extends BaseState {
  static STATES = {
    DRAFT: 'draft',
    PENDING: 'pending',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected',
  };

  static TRANSITIONS = {
    draft: ['pending', 'cancelled'],
    pending: ['active', 'rejected', 'cancelled'],
    active: ['paused', 'completed', 'cancelled'],
    paused: ['active', 'cancelled'],
    completed: [], // Estado final
    cancelled: [], // Estado final
    rejected: ['pending'], // Permite reenvio após ajustes
  };

  constructor(currentState = CollaborationState.STATES.DRAFT) {
    super(currentState, CollaborationState.TRANSITIONS);
  }

  /**
   * Submete colaboração para aprovação
   */
  submit(metadata = {}) {
    return this.transitionTo(CollaborationState.STATES.PENDING, {
      action: 'submit',
      submittedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Aprova colaboração
   */
  approve(approvedBy, metadata = {}) {
    return this.transitionTo(CollaborationState.STATES.ACTIVE, {
      action: 'approve',
      approvedBy,
      approvedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Rejeita colaboração
   */
  reject(reason, rejectedBy, metadata = {}) {
    return this.transitionTo(CollaborationState.STATES.REJECTED, {
      action: 'reject',
      reason,
      rejectedBy,
      rejectedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Pausa colaboração ativa
   */
  pause(reason, metadata = {}) {
    return this.transitionTo(CollaborationState.STATES.PAUSED, {
      action: 'pause',
      reason,
      pausedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Resume colaboração pausada
   */
  resume(metadata = {}) {
    return this.transitionTo(CollaborationState.STATES.ACTIVE, {
      action: 'resume',
      resumedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Completa colaboração
   */
  complete(metadata = {}) {
    return this.transitionTo(CollaborationState.STATES.COMPLETED, {
      action: 'complete',
      completedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Cancela colaboração
   */
  cancel(reason, metadata = {}) {
    return this.transitionTo(CollaborationState.STATES.CANCELLED, {
      action: 'cancel',
      reason,
      cancelledAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Verifica se colaboração está ativa
   */
  isActive() {
    return this.is(CollaborationState.STATES.ACTIVE);
  }

  /**
   * Verifica se pode ser editada
   */
  isEditable() {
    return this.isOneOf([CollaborationState.STATES.DRAFT, CollaborationState.STATES.REJECTED]);
  }

  /**
   * Verifica se está em estado final
   */
  isFinal() {
    return this.isOneOf([CollaborationState.STATES.COMPLETED, CollaborationState.STATES.CANCELLED]);
  }

  /**
   * Clona o estado
   */
  clone() {
    const cloned = new CollaborationState(this.currentState);
    cloned.history = [...this.history];
    cloned.metadata = { ...this.metadata };
    return cloned;
  }
}

module.exports = CollaborationState;
