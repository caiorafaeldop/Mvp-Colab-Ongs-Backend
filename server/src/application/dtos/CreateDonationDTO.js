const { createDonationSchema } = require('../../domain/validators/schemas/donationSchemas');

/**
 * DTO para criação de doação
 * Encapsula validação e transformação de dados para doações
 */
class CreateDonationDTO {
  constructor(data) {
    // Valida e transforma os dados usando Zod
    const validatedData = createDonationSchema.parse(data);
    
    // Atribui propriedades validadas
    Object.assign(this, validatedData);
  }

  /**
   * Método estático para validação sem instanciar
   * @param {Object} data - Dados a serem validados
   * @returns {Object} Dados validados
   */
  static validate(data) {
    return createDonationSchema.parse(data);
  }

  /**
   * Método estático para validação segura (não lança exceção)
   * @param {Object} data - Dados a serem validados
   * @returns {Object} { success: boolean, data?: Object, error?: ZodError }
   */
  static safeParse(data) {
    return createDonationSchema.safeParse(data);
  }

  /**
   * Converte DTO para objeto plano (para persistência)
   * @returns {Object} Objeto com dados da doação
   */
  toPlainObject() {
    return {
      amount: this.amount,
      currency: this.currency,
      donorId: this.donorId,
      recipientId: this.recipientId,
      description: this.description,
      isAnonymous: this.isAnonymous,
      paymentMethod: this.paymentMethod,
      metadata: this.metadata,
      status: 'pending', // Status inicial sempre pending
      createdAt: new Date()
    };
  }

  /**
   * Retorna valor formatado em centavos (para Mercado Pago)
   * @returns {number} Valor em centavos
   */
  getAmountInCents() {
    return Math.round(this.amount * 100);
  }

  /**
   * Retorna valor formatado em reais
   * @returns {string} Valor formatado (ex: "R$ 25,50")
   */
  getFormattedAmount() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount);
  }

  /**
   * Verifica se é uma doação anônima
   * @returns {boolean} True se for anônima
   */
  isAnonymousDonation() {
    return this.isAnonymous;
  }

  /**
   * Retorna dados para criação de pagamento no Mercado Pago
   * @returns {Object} Dados formatados para MP
   */
  toPaymentData() {
    return {
      transaction_amount: this.amount,
      description: this.description || `Doação de ${this.getFormattedAmount()}`,
      payment_method_id: this.paymentMethod,
      external_reference: `donation_${Date.now()}`, // Será substituído pelo ID real
      metadata: {
        ...this.metadata,
        donor_id: this.donorId,
        recipient_id: this.recipientId,
        is_anonymous: this.isAnonymous
      }
    };
  }

  /**
   * Retorna dados seguros para log
   * @returns {Object} Dados seguros para log
   */
  toLogObject() {
    return {
      amount: this.amount,
      currency: this.currency,
      donorId: this.donorId,
      recipientId: this.recipientId,
      paymentMethod: this.paymentMethod,
      isAnonymous: this.isAnonymous,
      hasDescription: !!this.description,
      hasMetadata: !!this.metadata
    };
  }

  /**
   * Valida se o valor está dentro dos limites permitidos
   * @returns {boolean} True se válido
   */
  isValidAmount() {
    return this.amount >= 1 && this.amount <= 100000;
  }

  /**
   * Retorna dados para notificação
   * @returns {Object} Dados para notificação
   */
  toNotificationData() {
    return {
      amount: this.getFormattedAmount(),
      donorId: this.isAnonymous ? null : this.donorId,
      recipientId: this.recipientId,
      description: this.description,
      paymentMethod: this.paymentMethod
    };
  }
}

module.exports = CreateDonationDTO;
