/**
 * TEMPLATE METHOD PATTERN - DonationService usando templates
 * Exemplo de como integrar templates no service existente
 */

const { TemplateExamples } = require('../templates');
const { logger } = require('../../infra/logger');

/**
 * Versão do DonationService que usa Template Method
 * Mantém compatibilidade com a interface existente
 */
class DonationServiceWithTemplate {
  constructor(donationRepository, userRepository, paymentAdapter, eventManager = null) {
    this.donationRepository = donationRepository;
    this.userRepository = userRepository;
    this.paymentAdapter = paymentAdapter;
    this.eventManager = eventManager;

    logger.info('[DONATION SERVICE TEMPLATE] Inicializado com Template Method');
  }

  /**
   * Cria uma doação única usando Template Method
   */
  async createSingleDonation(donationData, options = {}) {
    try {
      logger.info('[DONATION SERVICE TEMPLATE] Criando doação única com template', {
        organizationId: donationData.organizationId,
        amount: donationData.amount,
      });

      // Usar template para processar doação
      const result = await TemplateExamples.processDonation(donationData, 'single', {
        donationRepository: this.donationRepository,
        userRepository: this.userRepository,
        paymentAdapter: this.paymentAdapter,
        eventManager: this.eventManager,
        logger: options.logger || logger,
        ...options,
      });

      // Adaptar resultado para interface existente
      return {
        donation: result.data.donation,
        paymentUrl: result.data.payment.paymentUrl,
        mercadoPagoId: result.data.payment.id,
        amount: result.data.donation.amount,
        organizationName: result.data.donation.organizationName,
      };
    } catch (error) {
      logger.error('[DONATION SERVICE TEMPLATE] Erro ao criar doação única', {
        error: error.message,
        organizationId: donationData.organizationId,
        amount: donationData.amount,
      });
      throw error;
    }
  }

  /**
   * Cria uma doação recorrente usando Template Method
   */
  async createRecurringDonation(donationData, options = {}) {
    try {
      logger.info('[DONATION SERVICE TEMPLATE] Criando doação recorrente com template', {
        organizationId: donationData.organizationId,
        amount: donationData.amount,
        frequency: donationData.frequency,
      });

      // Usar template para processar doação recorrente
      const result = await TemplateExamples.processDonation(donationData, 'recurring', {
        donationRepository: this.donationRepository,
        userRepository: this.userRepository,
        paymentAdapter: this.paymentAdapter,
        eventManager: this.eventManager,
        logger: options.logger || logger,
        ...options,
      });

      // Adaptar resultado para interface existente
      return {
        donation: result.data.donation,
        subscriptionUrl: result.data.payment.subscriptionUrl,
        subscriptionId: result.data.payment.subscriptionId,
        amount: result.data.donation.amount,
        frequency: result.data.donation.frequency,
        organizationName: result.data.donation.organizationName,
      };
    } catch (error) {
      logger.error('[DONATION SERVICE TEMPLATE] Erro ao criar doação recorrente', {
        error: error.message,
        organizationId: donationData.organizationId,
        amount: donationData.amount,
        frequency: donationData.frequency,
      });
      throw error;
    }
  }

  /**
   * Processa webhook do Mercado Pago
   * Mantém implementação original por ser específica
   */
  async processPaymentWebhook(webhookData) {
    try {
      logger.info('[DONATION SERVICE TEMPLATE] Processando webhook', {
        type: webhookData.type,
        action: webhookData.action,
      });

      // Delegar para adapter de pagamento
      const result = await this.paymentAdapter.processWebhook(webhookData);

      logger.info('[DONATION SERVICE TEMPLATE] Webhook processado com sucesso', {
        paymentId: result.paymentId,
        status: result.status,
      });

      return result;
    } catch (error) {
      logger.error('[DONATION SERVICE TEMPLATE] Erro ao processar webhook', {
        error: error.message,
        webhookData,
      });
      throw error;
    }
  }

  /**
   * Gera relatório de doações usando Template Method
   */
  async generateDonationReport(reportParams, options = {}) {
    try {
      logger.info('[DONATION SERVICE TEMPLATE] Gerando relatório de doações', {
        organizationId: reportParams.organizationId,
        startDate: reportParams.startDate,
        endDate: reportParams.endDate,
      });

      // Usar template para gerar relatório
      const result = await TemplateExamples.generateReport(reportParams, 'donations', {
        donationRepository: this.donationRepository,
        userRepository: this.userRepository,
        format: options.format || 'json',
        logger: options.logger || logger,
        ...options,
      });

      return result.data.report;
    } catch (error) {
      logger.error('[DONATION SERVICE TEMPLATE] Erro ao gerar relatório', {
        error: error.message,
        organizationId: reportParams.organizationId,
      });
      throw error;
    }
  }

  /**
   * Métodos de compatibilidade com service original
   */

  async getDonations(organizationId, filters = {}) {
    // Implementação original mantida
    return await this.donationRepository.findByOrganizationId(organizationId, filters);
  }

  async getDonationById(donationId) {
    // Implementação original mantida
    return await this.donationRepository.findById(donationId);
  }

  async cancelRecurringDonation(subscriptionId) {
    // Implementação original mantida
    return await this.paymentAdapter.cancelSubscription(subscriptionId);
  }

  async getSubscriptionStatus(subscriptionId) {
    // Implementação original mantida
    return await this.paymentAdapter.getSubscriptionStatus(subscriptionId);
  }

  async getDonationStatistics(organizationId, filters = {}) {
    // Implementação original mantida
    const donations = await this.donationRepository.findByOrganizationId(organizationId, filters);

    return {
      totalDonations: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
      avgAmount:
        donations.length > 0
          ? donations.reduce((sum, d) => sum + d.amount, 0) / donations.length
          : 0,
      singleDonations: donations.filter((d) => d.type === 'single').length,
      recurringDonations: donations.filter((d) => d.type === 'recurring').length,
      approvedDonations: donations.filter((d) => d.paymentStatus === 'approved').length,
      pendingDonations: donations.filter((d) => d.paymentStatus === 'pending').length,
    };
  }
}

module.exports = DonationServiceWithTemplate;
