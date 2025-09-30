const { BaseTemplate } = require('./BaseTemplate');
const { logger } = require('../../infra/logger');

/**
 * TEMPLATE METHOD - Template para processamento de doações
 * Define o fluxo padrão: validar → preparar → processar pagamento → finalizar
 */

class DonationProcessTemplate extends BaseTemplate {
  constructor(options = {}) {
    super('DonationProcess');
    this.donationRepository = options.donationRepository;
    this.userRepository = options.userRepository;
    this.paymentAdapter = options.paymentAdapter;
    this.eventManager = options.eventManager;
  }
  
  /**
   * Valida os dados da doação
   */
  async validate() {
    this.setCurrentStep('validation');
    const { organizationId, amount, donorEmail, donorName } = this.context.input;
    
    // Validações básicas
    if (!organizationId) {
      throw new Error('ID da organização é obrigatório');
    }
    
    if (!amount || amount <= 0) {
      throw new Error('Valor da doação deve ser maior que zero');
    }
    
    if (!donorEmail) {
      throw new Error('Email do doador é obrigatório');
    }
    
    if (!donorName) {
      throw new Error('Nome do doador é obrigatório');
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(donorEmail)) {
      throw new Error('Formato de email inválido');
    }
    
    // Validações específicas do tipo de doação
    await this.validateDonationSpecifics();
    
    // Validar limites
    await this.validateLimits();
    
    this.requestLogger.debug('Dados da doação validados', {
      template: this.name,
      organizationId,
      amount,
      donorEmail,
      type: this.getDonationType()
    });
  }
  
  /**
   * Prepara os dados para processamento
   */
  async prepare() {
    this.setCurrentStep('preparation');
    const input = this.context.input;
    
    // Buscar informações da organização
    const organization = await this.getOrganizationInfo(input.organizationId);
    if (!organization) {
      throw new Error('Organização não encontrada');
    }
    
    // Preparar dados da doação
    const donationData = {
      organizationId: input.organizationId,
      organizationName: organization.name || input.organizationName,
      amount: parseFloat(input.amount),
      currency: 'BRL',
      type: this.getDonationType(),
      donorName: input.donorName.trim(),
      donorEmail: input.donorEmail.toLowerCase().trim(),
      donorPhone: input.donorPhone,
      donorDocument: input.donorDocument,
      message: input.message,
      isAnonymous: input.isAnonymous || false,
      status: 'pending',
      createdAt: new Date(),
      metadata: {
        ip: this.context.options.ip,
        userAgent: this.context.options.userAgent,
        source: 'web_api'
      }
    };
    
    // Adicionar dados específicos do tipo de doação
    await this.prepareDonationSpecifics(donationData);
    
    this.setContextData('donationData', donationData);
    this.setContextData('organization', organization);
    
    this.requestLogger.debug('Dados preparados para processamento', {
      template: this.name,
      organizationId: donationData.organizationId,
      amount: donationData.amount,
      type: donationData.type
    });
  }
  
  /**
   * Executa o processamento da doação
   */
  async process() {
    this.setCurrentStep('main_process');
    const donationData = this.getContextData('donationData');
    
    // Criar registro da doação no banco
    const donation = await this.donationRepository.create(donationData);
    this.setContextData('donation', donation);
    
    // Processar pagamento
    const paymentResult = await this.processPayment(donation);
    
    // Atualizar doação com dados do pagamento
    const updatedDonation = await this.updateDonationWithPayment(donation, paymentResult);
    
    const result = {
      donation: updatedDonation,
      payment: paymentResult,
      type: this.getDonationType()
    };
    
    this.requestLogger.info('Doação processada com sucesso', {
      template: this.name,
      donationId: donation.id || donation._id,
      amount: donationData.amount,
      paymentId: paymentResult.id,
      type: this.getDonationType()
    });
    
    return result;
  }
  
  /**
   * Finaliza o processamento
   */
  async finalize() {
    this.setCurrentStep('finalization');
    const result = this.context.result;
    
    // Registrar evento de doação
    await this.logDonationEvent(result);
    
    // Enviar notificações
    await this.sendNotifications(result);
    
    // Atualizar estatísticas
    await this.updateStatistics(result);
    
    // Adicionar metadados
    this.addMetadata('donationSuccess', true);
    this.addMetadata('donationId', result.donation.id || result.donation._id);
    this.addMetadata('paymentId', result.payment.id);
    
    this.requestLogger.debug('Processamento de doação finalizado', {
      template: this.name,
      donationId: result.donation.id || result.donation._id
    });
  }
  
  // ==========================================
  // MÉTODOS ABSTRATOS (devem ser implementados pelas subclasses)
  // ==========================================
  
  /**
   * Retorna o tipo de doação
   * @abstract
   * @returns {string} Tipo de doação
   */
  getDonationType() {
    throw new Error(`Method getDonationType() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Valida aspectos específicos do tipo de doação
   * @abstract
   */
  async validateDonationSpecifics() {
    throw new Error(`Method validateDonationSpecifics() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Prepara dados específicos do tipo de doação
   * @abstract
   */
  async prepareDonationSpecifics(donationData) {
    throw new Error(`Method prepareDonationSpecifics() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Processa o pagamento específico
   * @abstract
   */
  async processPayment(donation) {
    throw new Error(`Method processPayment() must be implemented by ${this.constructor.name}`);
  }
  
  // ==========================================
  // MÉTODOS UTILITÁRIOS
  // ==========================================
  
  /**
   * Valida limites de doação
   */
  async validateLimits() {
    const { amount } = this.context.input;
    const minAmount = process.env.MIN_DONATION_AMOUNT || 1;
    const maxAmount = process.env.MAX_DONATION_AMOUNT || 10000;
    
    if (amount < minAmount) {
      throw new Error(`Valor mínimo para doação é R$ ${minAmount}`);
    }
    
    if (amount > maxAmount) {
      throw new Error(`Valor máximo para doação é R$ ${maxAmount}`);
    }
  }
  
  /**
   * Obtém informações da organização
   */
  async getOrganizationInfo(organizationId) {
    if (this.userRepository) {
      try {
        return await this.userRepository.findById(organizationId);
      } catch (error) {
        this.requestLogger.warn('Erro ao buscar organização', {
          template: this.name,
          organizationId,
          error: error.message
        });
        return null;
      }
    }
    return null;
  }
  
  /**
   * Atualiza doação com dados do pagamento
   */
  async updateDonationWithPayment(donation, paymentResult) {
    const updateData = {
      paymentId: paymentResult.id,
      paymentStatus: paymentResult.status,
      paymentUrl: paymentResult.paymentUrl,
      updatedAt: new Date()
    };
    
    // Adicionar dados específicos do tipo de pagamento
    if (paymentResult.subscriptionId) {
      updateData.subscriptionId = paymentResult.subscriptionId;
    }
    
    return await this.donationRepository.updateById(donation.id || donation._id, updateData);
  }
  
  /**
   * Registra evento de doação
   */
  async logDonationEvent(result) {
    if (this.eventManager) {
      await this.eventManager.emit('donation.created', {
        donationId: result.donation.id || result.donation._id,
        organizationId: result.donation.organizationId,
        amount: result.donation.amount,
        type: result.donation.type,
        donorEmail: result.donation.donorEmail,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Envia notificações
   */
  async sendNotifications(result) {
    // Notificar organização
    await this.notifyOrganization(result);
    
    // Notificar doador
    await this.notifyDonor(result);
  }
  
  /**
   * Notifica a organização sobre a doação
   */
  async notifyOrganization(result) {
    this.requestLogger.info('Notificação enviada para organização', {
      template: this.name,
      organizationId: result.donation.organizationId,
      donationId: result.donation.id || result.donation._id
    });
  }
  
  /**
   * Notifica o doador
   */
  async notifyDonor(result) {
    this.requestLogger.info('Notificação enviada para doador', {
      template: this.name,
      donorEmail: result.donation.donorEmail,
      donationId: result.donation.id || result.donation._id
    });
  }
  
  /**
   * Atualiza estatísticas
   */
  async updateStatistics(result) {
    // Implementação de atualização de estatísticas
    this.requestLogger.debug('Estatísticas atualizadas', {
      template: this.name,
      organizationId: result.donation.organizationId,
      amount: result.donation.amount
    });
  }
  
  /**
   * Hook executado em caso de erro
   */
  async onError(error) {
    const donationData = this.getContextData('donationData');
    
    this.requestLogger.error('Erro durante processamento de doação', {
      template: this.name,
      organizationId: donationData?.organizationId,
      amount: donationData?.amount,
      error: error.message,
      step: this.getCurrentStep()
    });
    
    // Cleanup em caso de erro
    await this.cleanup();
  }
  
  /**
   * Limpeza em caso de erro
   */
  async cleanup() {
    const donation = this.getContextData('donation');
    
    if (donation) {
      try {
        // Marcar doação como falhada
        await this.donationRepository.updateById(donation.id || donation._id, {
          status: 'failed',
          updatedAt: new Date()
        });
      } catch (error) {
        this.requestLogger.error('Erro durante cleanup', {
          template: this.name,
          error: error.message
        });
      }
    }
  }
}

/**
 * Template para doações únicas
 */
class SingleDonationTemplate extends DonationProcessTemplate {
  constructor(options = {}) {
    super(options);
  }
  
  getDonationType() {
    return 'single';
  }
  
  async validateDonationSpecifics() {
    // Validações específicas para doações únicas
    // Implementação padrão vazia
  }
  
  async prepareDonationSpecifics(donationData) {
    // Preparação específica para doações únicas
    donationData.frequency = null;
  }
  
  async processPayment(donation) {
    if (!this.paymentAdapter) {
      throw new Error('Payment adapter não configurado');
    }
    
    return await this.paymentAdapter.createPaymentPreference({
      amount: donation.amount,
      description: `Doação para ${donation.organizationName}`,
      donorEmail: donation.donorEmail,
      donorName: donation.donorName,
      externalReference: donation.id || donation._id
    });
  }
}

/**
 * Template para doações recorrentes
 */
class RecurringDonationTemplate extends DonationProcessTemplate {
  constructor(options = {}) {
    super(options);
  }
  
  getDonationType() {
    return 'recurring';
  }
  
  async validateDonationSpecifics() {
    const { frequency, amount } = this.context.input;
    
    if (!frequency) {
      throw new Error('Frequência é obrigatória para doações recorrentes');
    }
    
    const validFrequencies = ['monthly', 'weekly', 'yearly'];
    if (!validFrequencies.includes(frequency)) {
      throw new Error('Frequência deve ser: monthly, weekly ou yearly');
    }
    
    // Valor mínimo para recorrentes
    if (amount < 5) {
      throw new Error('Valor mínimo para doação recorrente é R$ 5,00');
    }
  }
  
  async prepareDonationSpecifics(donationData) {
    const { frequency } = this.context.input;
    donationData.frequency = frequency;
  }
  
  async processPayment(donation) {
    if (!this.paymentAdapter) {
      throw new Error('Payment adapter não configurado');
    }
    
    return await this.paymentAdapter.createSubscription({
      amount: donation.amount,
      frequency: donation.frequency,
      description: `Doação recorrente para ${donation.organizationName}`,
      donorEmail: donation.donorEmail,
      donorName: donation.donorName,
      externalReference: donation.id || donation._id
    });
  }
}

module.exports = {
  DonationProcessTemplate,
  SingleDonationTemplate,
  RecurringDonationTemplate
};
