const IObserver = require('../../domain/observers/IObserver');
const { logger } = require('../logger');

/**
 * Observer para eventos relacionados a doações
 * Monitora criação, pagamento, cancelamento e recorrência
 */
class DonationObserver extends IObserver {
  constructor() {
    super();
    this.name = 'DonationObserver';
    this.eventTypes = [
      'donation.created',
      'donation.payment.approved',
      'donation.payment.rejected',
      'donation.payment.pending',
      'donation.cancelled',
      'donation.recurring.created',
      'donation.recurring.renewed',
      'donation.recurring.cancelled',
    ];
  }

  async update(event, context) {
    try {
      logger.info(`[${this.name}] Processando evento: ${event.type}`, {
        eventId: event.id,
        donationId: event.data?.donationId,
        timestamp: event.timestamp,
      });

      switch (event.type) {
        case 'donation.created':
          await this.handleDonationCreated(event, context);
          break;
        case 'donation.payment.approved':
          await this.handlePaymentApproved(event, context);
          break;
        case 'donation.payment.rejected':
          await this.handlePaymentRejected(event, context);
          break;
        case 'donation.payment.pending':
          await this.handlePaymentPending(event, context);
          break;
        case 'donation.cancelled':
          await this.handleDonationCancelled(event, context);
          break;
        case 'donation.recurring.created':
          await this.handleRecurringCreated(event, context);
          break;
        case 'donation.recurring.renewed':
          await this.handleRecurringRenewed(event, context);
          break;
        case 'donation.recurring.cancelled':
          await this.handleRecurringCancelled(event, context);
          break;
        default:
          logger.warn(`[${this.name}] Tipo de evento não tratado: ${event.type}`);
      }
    } catch (error) {
      logger.error(`[${this.name}] Erro ao processar evento`, {
        error: error.message,
        eventType: event.type,
        eventId: event.id,
      });
    }
  }

  shouldHandle(event) {
    return this.eventTypes.includes(event.type);
  }

  getName() {
    return this.name;
  }

  getEventTypes() {
    return this.eventTypes;
  }

  // Handlers específicos
  async handleDonationCreated(event, context) {
    logger.info(`[${this.name}] Nova doação criada`, {
      donationId: event.data.donationId,
      amount: event.data.amount,
      organizationId: event.data.organizationId,
      donorEmail: event.data.donorEmail,
    });

    // Lógica adicional:
    // - Enviar email de confirmação para doador
    // - Notificar organização sobre nova doação
    // - Registrar em analytics
  }

  async handlePaymentApproved(event, context) {
    logger.info(`[${this.name}] Pagamento aprovado`, {
      donationId: event.data.donationId,
      amount: event.data.amount,
      mercadoPagoId: event.data.mercadoPagoId,
    });

    // Lógica adicional:
    // - Enviar email de agradecimento
    // - Gerar recibo
    // - Atualizar estatísticas de arrecadação
    // - Notificar organização
  }

  async handlePaymentRejected(event, context) {
    logger.warn(`[${this.name}] Pagamento rejeitado`, {
      donationId: event.data.donationId,
      reason: event.data.reason,
    });

    // Lógica adicional:
    // - Enviar email explicando rejeição
    // - Oferecer métodos alternativos
    // - Registrar motivo de rejeição
  }

  async handlePaymentPending(event, context) {
    logger.info(`[${this.name}] Pagamento pendente`, {
      donationId: event.data.donationId,
      paymentMethod: event.data.paymentMethod,
    });

    // Lógica adicional:
    // - Enviar instruções de pagamento
    // - Configurar lembrete
  }

  async handleDonationCancelled(event, context) {
    logger.info(`[${this.name}] Doação cancelada`, {
      donationId: event.data.donationId,
    });

    // Lógica adicional:
    // - Processar reembolso se necessário
    // - Notificar partes envolvidas
  }

  async handleRecurringCreated(event, context) {
    logger.info(`[${this.name}] Doação recorrente criada`, {
      donationId: event.data.donationId,
      frequency: event.data.frequency,
      amount: event.data.amount,
    });

    // Lógica adicional:
    // - Enviar email de confirmação de assinatura
    // - Criar lembretes de cobrança
    // - Agradecer pelo compromisso recorrente
  }

  async handleRecurringRenewed(event, context) {
    logger.info(`[${this.name}] Doação recorrente renovada`, {
      subscriptionId: event.data.subscriptionId,
      amount: event.data.amount,
    });

    // Lógica adicional:
    // - Enviar recibo da cobrança mensal
    // - Atualizar estatísticas
  }

  async handleRecurringCancelled(event, context) {
    logger.info(`[${this.name}] Doação recorrente cancelada`, {
      subscriptionId: event.data.subscriptionId,
    });

    // Lógica adicional:
    // - Enviar email de confirmação de cancelamento
    // - Pedir feedback
    // - Oferecer alternativas
  }
}

module.exports = DonationObserver;
