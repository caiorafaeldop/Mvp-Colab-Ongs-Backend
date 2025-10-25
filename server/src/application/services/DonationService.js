/**
 * SERVICE LAYER - Serviço de gerenciamento de doações
 * Implementa regras de negócio para doações via Mercado Pago
 */
const PaymentState = require('../../domain/state/PaymentState');
const { TemplateExamples } = require('../templates');
const { logger } = require('../../infra/logger');
const { getInstance: getEventManager } = require('../../infra/events/EventManager');

class DonationService {
  constructor(donationRepository, userRepository, paymentAdapter) {
    this.donationRepository = donationRepository;
    this.userRepository = userRepository;
    this.paymentAdapter = paymentAdapter;
    this.eventManager = getEventManager();

    console.log('[DONATION SERVICE] Inicializado com sucesso');
  }

  /**
   * Cria uma doação única
   */
  async createSingleDonation(donationData) {
    try {
      console.log('[DONATION SERVICE] Criando doação única:', donationData);

      // 1. Validar dados
      this.validateDonationData(donationData);

      // 2. Criar preferência no Mercado Pago
      const paymentPreference = await this.paymentAdapter.createPaymentPreference({
        amount: donationData.amount,
        title: `Doação`,
        description: donationData.message || `Doação`,
        payer: {
          name: donationData.donorName,
          email: donationData.donorEmail,
          phone: donationData.donorPhone,
          document: donationData.donorDocument,
        },
        externalReference: `donation-${Date.now()}`,
      });

      // 3. Idempotency: se já existir uma doação com este MP ID, retorna existente
      try {
        if (this.donationRepository.existsByMercadoPagoId) {
          const exists = await this.donationRepository.existsByMercadoPagoId(paymentPreference.id);
          if (exists) {
            const existing = await this.donationRepository.findByMercadoPagoId(
              paymentPreference.id
            );
            return {
              donation: existing,
              paymentUrl: paymentPreference.paymentUrl,
              mercadoPagoId: paymentPreference.id,
            };
          }
        }
      } catch (_) {}

      // 4. Salvar doação no banco
      const donation = await this.donationRepository.create({
        organizationId: donationData.organizationId,
        organizationName: donationData.organizationName,
        amount: donationData.amount,
        currency: 'BRL',
        type: 'single',
        message: donationData.message,
        donorName: donationData.donorName,
        donorEmail: donationData.donorEmail,
        donorPhone: donationData.donorPhone,
        donorDocument: donationData.donorDocument,
        donorAddress: donationData.donorAddress,
        donorCity: donationData.donorCity,
        donorState: donationData.donorState,
        donorZipCode: donationData.donorZipCode,
        isAnonymous: donationData.isAnonymous || false,
        showInPublicList: donationData.showInPublicList !== false,
        mercadoPagoId: paymentPreference.id,
        paymentStatus: new PaymentState('pending').toDomain(),
        metadata: {
          externalReference: paymentPreference.externalReference,
        },
      });

      console.log('[DONATION SERVICE] Doação única criada:', donation.id);

      // Emit event
      await this.eventManager.emit(
        'donation.created',
        {
          donationId: donation.id,
          amount: donation.amount,
          organizationId: donation.organizationId,
          organizationName: donation.organizationName,
          donorEmail: donation.donorEmail,
        },
        { source: 'DonationService' }
      );

      return {
        donation,
        paymentUrl: paymentPreference.paymentUrl,
        mercadoPagoId: paymentPreference.id,
      };
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao criar doação única:', error);
      throw error;
    }
  }

  /**
   * Cria uma doação recorrente
   */
  async createRecurringDonation(donationData) {
    try {
      console.log('[DONATION SERVICE] Criando doação recorrente:', donationData);

      // 1. Validar dados
      this.validateDonationData(donationData);
      this.validateRecurringData(donationData);

      // 2. Criar assinatura no Mercado Pago
      const subscription = await this.paymentAdapter.createSubscription({
        amount: donationData.amount,
        frequency: donationData.frequency || 'monthly',
        title: `Doação Recorrente`,
        description: donationData.message || `Doação recorrente`,
        payer: {
          name: donationData.donorName,
          email: donationData.donorEmail,
          phone: donationData.donorPhone,
          document: donationData.donorDocument,
        },
        externalReference: `recurring-donation-${Date.now()}`,
      });

      // 3. Idempotency: se já existir uma doação com esta assinatura, retorna existente
      try {
        if (this.donationRepository.existsBySubscriptionId) {
          const exists = await this.donationRepository.existsBySubscriptionId(subscription.id);
          if (exists) {
            const existing = await this.donationRepository.findBySubscriptionId(subscription.id);
            return {
              donation: existing,
              subscriptionUrl: subscription.subscriptionUrl,
              subscriptionId: subscription.id,
            };
          }
        }
      } catch (_) {}

      // 4. Salvar doação no banco
      const donation = await this.donationRepository.create({
        organizationId: donationData.organizationId,
        organizationName: donationData.organizationName,
        amount: donationData.amount,
        currency: 'BRL',
        type: 'recurring',
        frequency: donationData.frequency || 'monthly',
        message: donationData.message,
        donorName: donationData.donorName,
        donorEmail: donationData.donorEmail,
        donorPhone: donationData.donorPhone,
        donorDocument: donationData.donorDocument,
        donorAddress: donationData.donorAddress,
        donorCity: donationData.donorCity,
        donorState: donationData.donorState,
        donorZipCode: donationData.donorZipCode,
        isAnonymous: donationData.isAnonymous || false,
        showInPublicList: donationData.showInPublicList !== false,
        subscriptionId: subscription.id,
        paymentStatus: new PaymentState('pending').toDomain(),
        metadata: {
          externalReference: subscription.externalReference,
        },
      });

      console.log('[DONATION SERVICE] Doação recorrente criada:', donation.id);

      // Emit event
      await this.eventManager.emit(
        'donation.recurring.created',
        {
          donationId: donation.id,
          frequency: donation.frequency,
          amount: donation.amount,
          organizationId: donation.organizationId,
        },
        { source: 'DonationService' }
      );

      return {
        donation,
        subscriptionUrl: subscription.subscriptionUrl,
        subscriptionId: subscription.id,
      };
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao criar doação recorrente:', error);
      throw error;
    }
  }

  /**
   * Processa webhook do Mercado Pago
   */
  async processPaymentWebhook(webhookData) {
    try {
      console.log('[DONATION SERVICE] Processando webhook:', webhookData);

      const processedData = await this.paymentAdapter.processWebhook(webhookData);

      if (processedData.type === 'payment') {
        // Atualizar status de doação única
        await this.updateDonationStatus(processedData.paymentId, processedData.status);
      } else if (processedData.type === 'subscription') {
        // Atualizar status de doação recorrente
        await this.updateSubscriptionStatus(processedData.subscriptionId, processedData.status);
      }

      return processedData;
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao processar webhook:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de uma doação
   */
  async updateDonationStatus(mercadoPagoId, status) {
    try {
      const donation = await this.donationRepository.findByMercadoPagoId(mercadoPagoId);

      if (donation) {
        await this.donationRepository.update(donation.id, {
          paymentStatus: PaymentState.fromMercadoPago(status).toDomain(),
          updatedAt: new Date(),
        });

        console.log('[DONATION SERVICE] Status da doação atualizado:', donation.id, status);

        // Emit status events
        const mappedStatus = PaymentState.fromMercadoPago(status).toDomain();
        if (mappedStatus === 'approved') {
          await this.eventManager.emit(
            'donation.payment.approved',
            {
              donationId: donation.id,
              amount: donation.amount,
              mercadoPagoId,
            },
            { source: 'DonationService' }
          );
        } else if (mappedStatus === 'rejected') {
          await this.eventManager.emit(
            'donation.payment.rejected',
            {
              donationId: donation.id,
              reason: status,
            },
            { source: 'DonationService' }
          );
        } else if (mappedStatus === 'pending') {
          await this.eventManager.emit(
            'donation.payment.pending',
            {
              donationId: donation.id,
              paymentMethod: donation.paymentMethod,
            },
            { source: 'DonationService' }
          );
        }
      }
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao atualizar status da doação:', error);
    }
  }

  /**
   * Lista doações de uma organização
   */
  async getDonationsByOrganization(organizationId, filters = {}) {
    try {
      return await this.donationRepository.findByOrganizationId(organizationId, filters);
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao buscar doações:', error);
      throw error;
    }
  }

  /**
   * Cancela uma assinatura recorrente
   */
  async cancelSubscription(subscriptionId) {
    try {
      console.log('[DONATION SERVICE] Cancelando assinatura:', subscriptionId);

      // Cancelar no Mercado Pago
      const result = await this.paymentAdapter.cancelSubscription(subscriptionId);

      // Atualizar no banco se encontrar a doação
      try {
        const donation = await this.donationRepository.findBySubscriptionId(subscriptionId);
        if (donation) {
          await this.donationRepository.update(donation.id, {
            paymentStatus: 'cancelled',
            updatedAt: new Date(),
          });
        }
      } catch (dbError) {
        console.warn('[DONATION SERVICE] Erro ao atualizar banco após cancelamento:', dbError);
      }

      console.log('[DONATION SERVICE] Assinatura cancelada:', subscriptionId);

      return result;
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao cancelar assinatura:', error);
      throw error;
    }
  }

  /**
   * Consulta status de uma assinatura
   */
  async getSubscriptionStatus(subscriptionId) {
    try {
      console.log('[DONATION SERVICE] Consultando status da assinatura:', subscriptionId);

      const result = await this.paymentAdapter.getSubscriptionStatus(subscriptionId);

      return result;
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao consultar status da assinatura:', error);
      throw error;
    }
  }

  /**
   * Cancela uma doação recorrente (método antigo - mantido para compatibilidade)
   */
  async cancelRecurringDonation(donationId, organizationId) {
    try {
      const donation = await this.donationRepository.findById(donationId);

      if (!donation) {
        throw new Error('Doação não encontrada');
      }

      if (donation.organizationId !== organizationId) {
        throw new Error('Não autorizado a cancelar esta doação');
      }

      if (donation.type !== 'recurring') {
        throw new Error('Apenas doações recorrentes podem ser canceladas');
      }

      // Cancelar no Mercado Pago
      await this.paymentAdapter.cancelSubscription(donation.subscriptionId);

      // Atualizar no banco
      await this.donationRepository.update(donationId, {
        paymentStatus: 'cancelled',
        updatedAt: new Date(),
      });

      console.log('[DONATION SERVICE] Doação recorrente cancelada:', donationId);

      return { success: true, message: 'Doação recorrente cancelada com sucesso' };
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao cancelar doação recorrente:', error);
      throw error;
    }
  }

  /**
   * Validações privadas
   */
  validateDonationData(data) {
    if (!data.amount || data.amount <= 0) {
      throw new Error('Valor da doação deve ser maior que zero');
    }

    if (!data.donorEmail) {
      throw new Error('Email do doador é obrigatório');
    }

    if (!data.donorName) {
      throw new Error('Nome do doador é obrigatório');
    }

    // Validação de email removida - aceita qualquer string no donorEmail
    // Isso permite que admins com usernames não-email façam doações
  }
  validateRecurringData(data) {
    const validFrequencies = ['monthly', 'weekly', 'yearly'];

    if (data.frequency && !validFrequencies.includes(data.frequency)) {
      throw new Error('Frequência inválida. Use: monthly, weekly ou yearly');
    }
  }

  async updateSubscriptionStatus(subscriptionId, status) {
    try {
      const donation = await this.donationRepository.findBySubscriptionId(subscriptionId);

      if (donation) {
        await this.donationRepository.update(donation.id, {
          paymentStatus: PaymentState.fromMercadoPago(status).toDomain(),
          updatedAt: new Date(),
        });

        console.log('[DONATION SERVICE] Status da assinatura atualizado:', donation.id, status);
      }
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao atualizar status da assinatura:', error);
    }
  }

  mapMercadoPagoStatus(mpStatus) {
    return PaymentState.fromMercadoPago(mpStatus).toDomain();
  }

  /**
   * Atualiza uma assinatura (pausar/reativar/alterar valor/frequência)
   */
  async updateSubscription(subscriptionId, options = {}) {
    try {
      console.log('[DONATION SERVICE] Atualizando assinatura:', subscriptionId, options);

      // Buscar a doação para validação e atualização no banco
      const donation = await this.donationRepository.findBySubscriptionId(subscriptionId);
      if (!donation) {
        throw new Error('Assinatura não encontrada');
      }

      const updateData = {};
      const adapterOptions = {};

      // Processar ação (pause/resume/update)
      if (options.action === 'pause') {
        adapterOptions.status = 'paused';
        updateData.paymentStatus = 'paused';
      } else if (options.action === 'resume') {
        adapterOptions.status = 'authorized';
        updateData.paymentStatus = 'approved';
      } else if (options.action === 'update') {
        if (options.amount) {
          adapterOptions.amount = options.amount;
          updateData.amount = options.amount;
        }
        if (options.frequency) {
          adapterOptions.frequency = options.frequency;
          updateData.frequency = options.frequency;
        }
      }

      // Atualizar no Mercado Pago
      const result = await this.paymentAdapter.updateSubscription(subscriptionId, adapterOptions);

      // Atualizar no banco de dados
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        await this.donationRepository.update(donation.id, updateData);
      }

      console.log('[DONATION SERVICE] Assinatura atualizada com sucesso');

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao atualizar assinatura:', error);
      throw error;
    }
  }

  /**
   * Reautoriza uma assinatura (cria nova URL de checkout para atualizar cartão)
   */
  async reauthorizeSubscription(subscriptionId) {
    try {
      console.log('[DONATION SERVICE] Reautorizando assinatura:', subscriptionId);

      // Buscar doação existente
      const donation = await this.donationRepository.findBySubscriptionId(subscriptionId);
      if (!donation) {
        throw new Error('Assinatura não encontrada');
      }

      // Criar nova assinatura com os mesmos dados
      const newSubscription = await this.paymentAdapter.createSubscription({
        amount: donation.amount,
        frequency: donation.frequency || 'monthly',
        title: `Doação Recorrente - Reautorização`,
        description: donation.message || `Doação recorrente - atualização de cartão`,
        payer: {
          name: donation.donorName,
          email: donation.donorEmail,
          phone: donation.donorPhone,
          document: donation.donorDocument,
        },
        externalReference: `reauth-${subscriptionId}-${Date.now()}`,
      });

      console.log(
        '[DONATION SERVICE] Nova assinatura criada para reautorização:',
        newSubscription.id
      );

      return {
        subscriptionUrl: newSubscription.subscriptionUrl,
        subscriptionId: newSubscription.id,
        oldSubscriptionId: subscriptionId,
      };
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao reautorizar assinatura:', error);
      throw error;
    }
  }

  /**
   * Busca assinatura ativa do doador por email
   */
  async getMySubscriptionByEmail(email) {
    try {
      console.log('[DONATION SERVICE] Buscando assinatura por email:', email);

      // Buscar doações do email
      const donations = await this.donationRepository.findByDonorEmail(email);

      // Filtrar apenas recorrentes não canceladas
      const activeDonation = donations.find(
        (d) => d.type === 'recurring' && d.paymentStatus !== 'cancelled' && d.subscriptionId
      );

      if (!activeDonation) {
        return null;
      }

      // Buscar status atualizado no Mercado Pago
      let mpStatus = {};
      try {
        mpStatus = await this.paymentAdapter.getSubscriptionStatus(activeDonation.subscriptionId);
      } catch (error) {
        console.warn('[DONATION SERVICE] Erro ao buscar status no MP:', error.message);
      }

      // Mesclar dados
      return {
        id: activeDonation.id,
        subscriptionId: activeDonation.subscriptionId,
        amount: mpStatus.amount || activeDonation.amount,
        frequency: activeDonation.frequency,
        status: mpStatus.status || activeDonation.paymentStatus,
        donorName: activeDonation.donorName,
        donorEmail: activeDonation.donorEmail,
        createdAt: activeDonation.createdAt,
        subscriptionUrl: activeDonation.metadata?.subscriptionUrl,
      };
    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao buscar assinatura por email:', error);
      throw error;
    }
  }

  // ==========================================
  // NOVOS MÉTODOS COM TEMPLATE METHOD PATTERN
  // ==========================================

  /**
   * Cria uma doação única usando Template Method
   * Versão mais robusta com logs estruturados e validações padronizadas
   */
  async createSingleDonationWithTemplate(donationData, options = {}) {
    try {
      logger.info('[DONATION SERVICE] Criando doação única com Template Method', {
        organizationId: donationData.organizationId,
        amount: donationData.amount,
        method: 'template',
      });

      // Usar template para processar doação
      const result = await TemplateExamples.processDonation(donationData, 'single', {
        donationRepository: this.donationRepository,
        userRepository: this.userRepository,
        paymentAdapter: this.paymentAdapter,
        logger: options.logger || logger,
        ...options,
      });

      // Adaptar resultado para interface compatível com método original
      return {
        donation: result.data.donation,
        paymentUrl: result.data.payment.paymentUrl,
        mercadoPagoId: result.data.payment.id,
        amount: result.data.donation.amount,
        organizationName: result.data.donation.organizationName,
        templateUsed: true, // Flag para identificar que usou template
      };
    } catch (error) {
      logger.error('[DONATION SERVICE] Erro ao criar doação única com template', {
        error: error.message,
        organizationId: donationData.organizationId,
        amount: donationData.amount,
        method: 'template',
      });
      throw error;
    }
  }

  /**
   * Cria uma doação recorrente usando Template Method
   * Versão mais robusta com logs estruturados e validações padronizadas
   */
  async createRecurringDonationWithTemplate(donationData, options = {}) {
    try {
      logger.info('[DONATION SERVICE] Criando doação recorrente com Template Method', {
        organizationId: donationData.organizationId,
        amount: donationData.amount,
        frequency: donationData.frequency,
        method: 'template',
      });

      // Usar template para processar doação recorrente
      const result = await TemplateExamples.processDonation(donationData, 'recurring', {
        donationRepository: this.donationRepository,
        userRepository: this.userRepository,
        paymentAdapter: this.paymentAdapter,
        logger: options.logger || logger,
        ...options,
      });

      // Adaptar resultado para interface compatível com método original
      return {
        donation: result.data.donation,
        subscriptionUrl: result.data.payment.subscriptionUrl,
        subscriptionId: result.data.payment.subscriptionId,
        amount: result.data.donation.amount,
        frequency: result.data.donation.frequency,
        organizationName: result.data.donation.organizationName,
        templateUsed: true, // Flag para identificar que usou template
      };
    } catch (error) {
      logger.error('[DONATION SERVICE] Erro ao criar doação recorrente com template', {
        error: error.message,
        organizationId: donationData.organizationId,
        amount: donationData.amount,
        frequency: donationData.frequency,
        method: 'template',
      });
      throw error;
    }
  }

  /**
   * Gera relatório de doações usando Template Method
   * Novo método que não existia antes - mostra valor agregado do template
   */
  async generateDonationReportWithTemplate(reportParams, options = {}) {
    try {
      logger.info('[DONATION SERVICE] Gerando relatório de doações com Template Method', {
        organizationId: reportParams.organizationId,
        startDate: reportParams.startDate,
        endDate: reportParams.endDate,
        method: 'template',
      });

      // Usar template para gerar relatório
      const result = await TemplateExamples.generateReport(reportParams, 'donations', {
        donationRepository: this.donationRepository,
        userRepository: this.userRepository,
        format: options.format || 'json',
        logger: options.logger || logger,
        ...options,
      });

      return {
        report: result.data.report,
        metadata: result.metadata,
        templateUsed: true,
      };
    } catch (error) {
      logger.error('[DONATION SERVICE] Erro ao gerar relatório com template', {
        error: error.message,
        organizationId: reportParams.organizationId,
        method: 'template',
      });
      throw error;
    }
  }
}

module.exports = DonationService;
