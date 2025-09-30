const BaseState = require('./BaseState');

/**
 * Project State - Gerencia estados de projetos das ONGs
 */
class ProjectState extends BaseState {
  static STATES = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    IN_PROGRESS: 'in_progress',
    ON_HOLD: 'on_hold',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
    CANCELLED: 'cancelled',
  };

  static TRANSITIONS = {
    draft: ['published', 'cancelled'],
    published: ['in_progress', 'archived', 'cancelled'],
    in_progress: ['on_hold', 'completed', 'cancelled'],
    on_hold: ['in_progress', 'cancelled'],
    completed: ['archived'],
    archived: ['published'], // Permite republicar
    cancelled: ['draft'], // Permite recriar
  };

  constructor(currentState = ProjectState.STATES.DRAFT) {
    super(currentState, ProjectState.TRANSITIONS);
  }

  /**
   * Publica projeto
   */
  publish(publishedBy, metadata = {}) {
    return this.transitionTo(ProjectState.STATES.PUBLISHED, {
      action: 'publish',
      publishedBy,
      publishedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Inicia execução do projeto
   */
  start(startedBy, metadata = {}) {
    return this.transitionTo(ProjectState.STATES.IN_PROGRESS, {
      action: 'start',
      startedBy,
      startedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Coloca projeto em espera
   */
  hold(reason, metadata = {}) {
    return this.transitionTo(ProjectState.STATES.ON_HOLD, {
      action: 'hold',
      reason,
      heldAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Completa projeto
   */
  complete(completedBy, metadata = {}) {
    return this.transitionTo(ProjectState.STATES.COMPLETED, {
      action: 'complete',
      completedBy,
      completedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Arquiva projeto
   */
  archive(archivedBy, metadata = {}) {
    return this.transitionTo(ProjectState.STATES.ARCHIVED, {
      action: 'archive',
      archivedBy,
      archivedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Cancela projeto
   */
  cancel(reason, cancelledBy, metadata = {}) {
    return this.transitionTo(ProjectState.STATES.CANCELLED, {
      action: 'cancel',
      reason,
      cancelledBy,
      cancelledAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Verifica se projeto está em execução
   */
  isInProgress() {
    return this.is(ProjectState.STATES.IN_PROGRESS);
  }

  /**
   * Verifica se projeto pode receber contribuições
   */
  canReceiveDonations() {
    return this.isOneOf([ProjectState.STATES.PUBLISHED, ProjectState.STATES.IN_PROGRESS]);
  }

  /**
   * Verifica se pode ser editado
   */
  isEditable() {
    return this.isOneOf([ProjectState.STATES.DRAFT, ProjectState.STATES.ON_HOLD]);
  }

  /**
   * Verifica se está finalizado
   */
  isFinalized() {
    return this.isOneOf([ProjectState.STATES.COMPLETED, ProjectState.STATES.ARCHIVED]);
  }

  /**
   * Clona o estado
   */
  clone() {
    const cloned = new ProjectState(this.currentState);
    cloned.history = [...this.history];
    cloned.metadata = { ...this.metadata };
    return cloned;
  }
}

module.exports = ProjectState;
