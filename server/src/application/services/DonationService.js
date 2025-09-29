/**
 * SERVICE LAYER - Serviço de gerenciamento de doações
 * Implementa regras de negócio para doações via Mercado Pago
 */
const PaymentState = require('../../domain/state/PaymentState');

class DonationService {
  constructor(donationRepository, userRepository, paymentAdapter) {
    this.donationRepository = donationRepository;
    this.userRepository = userRepository;
    this.paymentAdapter = paymentAdapter;
    
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
          document: donationData.donorDocument
        },
        externalReference: `donation-${Date.now()}`
      });

      // 3. Idempotency: se já existir uma doação com este MP ID, retorna existente
      try {
        if (this.donationRepository.existsByMercadoPagoId) {
          const exists = await this.donationRepository.existsByMercadoPagoId(paymentPreference.id);
          if (exists) {
            const existing = await this.donationRepository.findByMercadoPagoId(paymentPreference.id);
            return {
              donation: existing,
              paymentUrl: paymentPreference.paymentUrl,
              mercadoPagoId: paymentPreference.id
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
          externalReference: paymentPreference.externalReference
        }
      });

      console.log('[DONATION SERVICE] Doação única criada:', donation.id);

      return {
        donation,
        paymentUrl: paymentPreference.paymentUrl,
        mercadoPagoId: paymentPreference.id
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
          document: donationData.donorDocument
        },
        externalReference: `recurring-donation-${Date.now()}`
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
              subscriptionId: subscription.id
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
          externalReference: subscription.externalReference
        }
      });

      console.log('[DONATION SERVICE] Doação recorrente criada:', donation.id);

      return {
        donation,
        subscriptionUrl: subscription.subscriptionUrl,
        subscriptionId: subscription.id
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
          updatedAt: new Date()
        });
        
        console.log('[DONATION SERVICE] Status da doação atualizado:', donation.id, status);
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
            updatedAt: new Date()
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
        updatedAt: new Date()
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

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.donorEmail)) {
      throw new Error('Email do doador inválido');
    }
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
          updatedAt: new Date()
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
}

module.exports = DonationService;
