/**
 * State Pattern para status de pagamento
 * Fornece normalização e transições simples com base em eventos externos
 */
class PaymentState {
  constructor(status) {
    this.status = status; // 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back' | 'unknown'
  }

  toDomain() {
    return this.status;
  }

  // Transição simples baseada em evento
  next(event) {
    switch (event) {
      case 'approve':
      case 'authorized':
        return new PaymentState('approved');
      case 'reject':
        return new PaymentState('rejected');
      case 'cancel':
        return new PaymentState('cancelled');
      case 'refund':
        return new PaymentState('refunded');
      case 'chargeback':
        return new PaymentState('charged_back');
      default:
        return new PaymentState(this.status);
    }
  }

  static fromMercadoPago(mpStatus) {
    const normalized = (mpStatus || '').toString().toLowerCase();
    const map = {
      pending: 'pending',
      approved: 'approved',
      authorized: 'approved',
      in_process: 'pending',
      in_mediation: 'pending',
      rejected: 'rejected',
      cancelled: 'cancelled',
      canceled: 'cancelled',
      refunded: 'refunded',
      charged_back: 'charged_back',
    };

    return new PaymentState(map[normalized] || 'unknown');
  }
}

module.exports = PaymentState;
