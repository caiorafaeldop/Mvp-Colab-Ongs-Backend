const BaseState = require('./BaseState');

/**
 * Enhanced Payment State com FSM completa
 * Gerencia estados e transições de pagamento
 */
class EnhancedPaymentState extends BaseState {
  static STATES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    CHARGED_BACK: 'charged_back',
    IN_PROCESS: 'in_process',
    UNKNOWN: 'unknown',
  };

  static TRANSITIONS = {
    pending: ['approved', 'rejected', 'cancelled', 'in_process'],
    in_process: ['approved', 'rejected', 'cancelled'],
    approved: ['refunded', 'charged_back', 'cancelled'],
    rejected: ['pending'], // Permite retry
    cancelled: [], // Estado final
    refunded: ['charged_back'], // Pode ter chargeback depois de refund
    charged_back: [], // Estado final
    unknown: ['pending', 'approved', 'rejected'], // Pode transicionar para qualquer estado conhecido
  };

  constructor(currentState = EnhancedPaymentState.STATES.PENDING) {
    super(currentState, EnhancedPaymentState.TRANSITIONS);
  }

  /**
   * Transição baseada em evento do Mercado Pago
   * @param {string} event - Evento do webhook
   * @param {Object} metadata - Dados adicionais
   * @returns {EnhancedPaymentState}
   */
  handleWebhookEvent(event, metadata = {}) {
    const eventMapping = {
      'payment.created': EnhancedPaymentState.STATES.PENDING,
      'payment.updated': this._inferStateFromPaymentData(metadata),
      'payment.approved': EnhancedPaymentState.STATES.APPROVED,
      'payment.rejected': EnhancedPaymentState.STATES.REJECTED,
      'payment.cancelled': EnhancedPaymentState.STATES.CANCELLED,
      'payment.refunded': EnhancedPaymentState.STATES.REFUNDED,
      'payment.charged_back': EnhancedPaymentState.STATES.CHARGED_BACK,
    };

    const targetState = eventMapping[event] || this.currentState;

    if (targetState === this.currentState) {
      return this; // Sem mudança de estado
    }

    return this.transitionTo(targetState, {
      event,
      ...metadata,
      source: 'mercadopago_webhook',
    });
  }

  /**
   * Infere estado dos dados do pagamento
   * @private
   */
  _inferStateFromPaymentData(data) {
    if (data.status) {
      return this.constructor.fromMercadoPago(data.status).getState();
    }
    return this.currentState;
  }

  /**
   * Approve payment
   */
  approve(metadata = {}) {
    return this.transitionTo(EnhancedPaymentState.STATES.APPROVED, {
      action: 'approve',
      ...metadata,
    });
  }

  /**
   * Reject payment
   */
  reject(reason, metadata = {}) {
    return this.transitionTo(EnhancedPaymentState.STATES.REJECTED, {
      action: 'reject',
      reason,
      ...metadata,
    });
  }

  /**
   * Cancel payment
   */
  cancel(reason, metadata = {}) {
    return this.transitionTo(EnhancedPaymentState.STATES.CANCELLED, {
      action: 'cancel',
      reason,
      ...metadata,
    });
  }

  /**
   * Refund payment
   */
  refund(amount, metadata = {}) {
    return this.transitionTo(EnhancedPaymentState.STATES.REFUNDED, {
      action: 'refund',
      amount,
      ...metadata,
    });
  }

  /**
   * Mark as chargeback
   */
  chargeback(metadata = {}) {
    return this.transitionTo(EnhancedPaymentState.STATES.CHARGED_BACK, {
      action: 'chargeback',
      ...metadata,
    });
  }

  /**
   * Verifica se pagamento foi completado com sucesso
   */
  isSuccessful() {
    return this.is(EnhancedPaymentState.STATES.APPROVED);
  }

  /**
   * Verifica se pagamento falhou
   */
  isFailed() {
    return this.isOneOf([
      EnhancedPaymentState.STATES.REJECTED,
      EnhancedPaymentState.STATES.CANCELLED,
    ]);
  }

  /**
   * Verifica se está em estado final
   */
  isFinal() {
    return this.getAvailableTransitions().length === 0;
  }

  /**
   * Normaliza status do Mercado Pago
   * @param {string} mpStatus
   * @returns {EnhancedPaymentState}
   */
  static fromMercadoPago(mpStatus) {
    const normalized = (mpStatus || '').toString().toLowerCase();
    const map = {
      pending: EnhancedPaymentState.STATES.PENDING,
      approved: EnhancedPaymentState.STATES.APPROVED,
      authorized: EnhancedPaymentState.STATES.APPROVED,
      in_process: EnhancedPaymentState.STATES.IN_PROCESS,
      in_mediation: EnhancedPaymentState.STATES.IN_PROCESS,
      rejected: EnhancedPaymentState.STATES.REJECTED,
      cancelled: EnhancedPaymentState.STATES.CANCELLED,
      canceled: EnhancedPaymentState.STATES.CANCELLED,
      refunded: EnhancedPaymentState.STATES.REFUNDED,
      charged_back: EnhancedPaymentState.STATES.CHARGED_BACK,
    };

    return new EnhancedPaymentState(map[normalized] || EnhancedPaymentState.STATES.UNKNOWN);
  }

  /**
   * Clona o estado
   */
  clone() {
    const cloned = new EnhancedPaymentState(this.currentState);
    cloned.history = [...this.history];
    cloned.metadata = { ...this.metadata };
    return cloned;
  }
}

module.exports = EnhancedPaymentState;
