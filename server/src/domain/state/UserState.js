const BaseState = require('./BaseState');

/**
 * User State - Gerencia estados de usuários
 */
class UserState extends BaseState {
  static STATES = {
    PENDING_VERIFICATION: 'pending_verification',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    BANNED: 'banned',
    DELETED: 'deleted'
  };

  static TRANSITIONS = {
    pending_verification: ['active', 'deleted'],
    active: ['inactive', 'suspended', 'deleted'],
    inactive: ['active', 'deleted'],
    suspended: ['active', 'banned', 'deleted'],
    banned: ['deleted'], // Ban permanente, só pode ser deletado
    deleted: [] // Estado final
  };

  constructor(currentState = UserState.STATES.PENDING_VERIFICATION) {
    super(currentState, UserState.TRANSITIONS);
  }

  /**
   * Ativa usuário após verificação
   */
  activate(verifiedBy, metadata = {}) {
    return this.transitionTo(UserState.STATES.ACTIVE, {
      action: 'activate',
      verifiedBy,
      activatedAt: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Desativa usuário (inatividade)
   */
  deactivate(reason, metadata = {}) {
    return this.transitionTo(UserState.STATES.INACTIVE, {
      action: 'deactivate',
      reason,
      deactivatedAt: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Suspende usuário temporariamente
   */
  suspend(reason, duration, suspendedBy, metadata = {}) {
    return this.transitionTo(UserState.STATES.SUSPENDED, {
      action: 'suspend',
      reason,
      duration,
      suspendedBy,
      suspendedAt: new Date().toISOString(),
      expiresAt: duration ? new Date(Date.now() + duration).toISOString() : null,
      ...metadata
    });
  }

  /**
   * Bane usuário permanentemente
   */
  ban(reason, bannedBy, metadata = {}) {
    return this.transitionTo(UserState.STATES.BANNED, {
      action: 'ban',
      reason,
      bannedBy,
      bannedAt: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Deleta usuário (soft delete)
   */
  delete(deletedBy, metadata = {}) {
    return this.transitionTo(UserState.STATES.DELETED, {
      action: 'delete',
      deletedBy,
      deletedAt: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Verifica se usuário está ativo
   */
  isActive() {
    return this.is(UserState.STATES.ACTIVE);
  }

  /**
   * Verifica se pode fazer login
   */
  canLogin() {
    return this.isOneOf([
      UserState.STATES.ACTIVE,
      UserState.STATES.INACTIVE
    ]);
  }

  /**
   * Verifica se está bloqueado
   */
  isBlocked() {
    return this.isOneOf([
      UserState.STATES.SUSPENDED,
      UserState.STATES.BANNED,
      UserState.STATES.DELETED
    ]);
  }

  /**
   * Verifica se precisa verificação
   */
  needsVerification() {
    return this.is(UserState.STATES.PENDING_VERIFICATION);
  }

  /**
   * Clona o estado
   */
  clone() {
    const cloned = new UserState(this.currentState);
    cloned.history = [...this.history];
    cloned.metadata = { ...this.metadata };
    return cloned;
  }
}

module.exports = UserState;
