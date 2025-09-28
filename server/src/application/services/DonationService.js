/**
 * SERVICE LAYER - Serviço de gerenciamento de doações
 * Implementa regras de negócio para doações via Mercado Pago
 */

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

      // 2. Buscar organização
      const organization = await this.userRepository.findById(donationData.organizationId);
      if (!organization) {
        throw new Error('Organização não encontrada');
      }

      // 3. Verificar se a organização tem Mercado Pago configurado
      if (!organization.mercadoPagoAccessToken) {
        throw new Error('Organização não possui Mercado Pago configurado');
      }

      // 4. Criar preferência no Mercado Pago
      const paymentPreference = await this.paymentAdapter.createPaymentPreference({
        amount: donationData.amount,
        title: `Doação para ${organization.name}`,
        description: donationData.message || `Doação para apoiar ${organization.name}`,
        payer: {
          name: donationData.donorName,
          email: donationData.donorEmail,
          phone: donationData.donorPhone,
          document: donationData.donorDocument
        },
        externalReference: `donation-${organization.id}-${Date.now()}`
      });

      // 5. Salvar doação no banco
      const donation = await this.donationRepository.create({
        organizationId: organization.id,
        organizationName: organization.name,
        amount: donationData.amount,
        currency: 'BRL',
        type: 'single',
        donorName: donationData.donorName,
        donorEmail: donationData.donorEmail,
        donorPhone: donationData.donorPhone,
        donorDocument: donationData.donorDocument,
        mercadoPagoId: paymentPreference.id,
        paymentStatus: 'pending',
        metadata: {
          message: donationData.message,
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

      // 2. Buscar organização
      const organization = await this.userRepository.findById(donationData.organizationId);
      if (!organization) {
        throw new Error('Organização não encontrada');
      }

      // 3. Verificar se a organização tem Mercado Pago configurado
      if (!organization.mercadoPagoAccessToken) {
        throw new Error('Organização não possui Mercado Pago configurado');
      }

      // 4. Criar assinatura no Mercado Pago
      const subscription = await this.paymentAdapter.createSubscription({
        amount: donationData.amount,
        frequency: donationData.frequency || 'monthly',
        title: `Doação Recorrente para ${organization.name}`,
        payer: {
          name: donationData.donorName,
          email: donationData.donorEmail,
          phone: donationData.donorPhone,
          document: donationData.donorDocument
        },
        externalReference: `subscription-${organization.id}-${Date.now()}`
      });

      // 5. Salvar doação no banco
      const donation = await this.donationRepository.create({
        organizationId: organization.id,
        organizationName: organization.name,
        amount: donationData.amount,
        currency: 'BRL',
        type: 'recurring',
        frequency: donationData.frequency || 'monthly',
        donorName: donationData.donorName,
        donorEmail: donationData.donorEmail,
        donorPhone: donationData.donorPhone,
        donorDocument: donationData.donorDocument,
        subscriptionId: subscription.id,
        paymentStatus: 'pending',
        metadata: {
          message: donationData.message,
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
          paymentStatus: this.mapMercadoPagoStatus(status),
          updatedAt: new Date()
        });
        
        console.log('[DONATION SERVICE] Status da doação atualizado:', donation.id, status);
      }

    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao atualizar status da doação:', error);
    }
  }

  /**
   * Atualiza status de uma assinatura
   */
  async updateSubscriptionStatus(subscriptionId, status) {
    try {
      const donation = await this.donationRepository.findBySubscriptionId(subscriptionId);
      
      if (donation) {
        await this.donationRepository.update(donation.id, {
          paymentStatus: this.mapMercadoPagoStatus(status),
          updatedAt: new Date()
        });
        
        console.log('[DONATION SERVICE] Status da assinatura atualizado:', donation.id, status);
      }

    } catch (error) {
      console.error('[DONATION SERVICE] Erro ao atualizar status da assinatura:', error);
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
   * Cancela uma doação recorrente
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
    if (!data.organizationId) {
      throw new Error('ID da organização é obrigatório');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('Valor da doação deve ser maior que zero');
    }

    if (!data.donorEmail) {
      throw new Error('Email do doador é obrigatório');
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

  mapMercadoPagoStatus(mpStatus) {
    const statusMap = {
      'pending': 'pending',
      'approved': 'approved',
      'authorized': 'approved',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'charged_back'
    };

    return statusMap[mpStatus] || 'unknown';
  }
}

module.exports = DonationService;
