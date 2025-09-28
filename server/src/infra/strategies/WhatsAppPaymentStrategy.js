const IPaymentStrategy = require('../../domain/strategies/IPaymentStrategy');

/**
 * Estratégia de pagamento via WhatsApp (negociação direta)
 * Para marketplace de ONGs onde comprador e vendedor negociam diretamente
 */
class WhatsAppPaymentStrategy extends IPaymentStrategy {
  constructor() {
    super();
    this.name = 'WhatsAppPaymentStrategy';
  }

  /**
   * Processa "pagamento" via WhatsApp (na verdade gera link de contato)
   * @param {Object} paymentData - Dados do pagamento
   * @returns {Promise<Object>} Resultado do processamento
   */
  async processPayment(paymentData) {
    try {
      const { amount, buyer, seller, product, quantity } = paymentData;

      // Valida dados
      const validation = this.validatePaymentData(paymentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          code: 'VALIDATION_ERROR'
        };
      }

      // Gera mensagem personalizada para WhatsApp
      const message = this.generateWhatsAppMessage(product, buyer, quantity, amount);
      
      // Gera link do WhatsApp
      const whatsappLink = this.generateWhatsAppLink(seller.phone, message);

      return {
        success: true,
        paymentMethod: 'whatsapp',
        transactionId: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        whatsappLink: whatsappLink,
        message: message,
        instructions: [
          'Clique no link para abrir WhatsApp',
          'Envie a mensagem para a ONG',
          'Negocie forma de pagamento e entrega',
          'Confirme a compra diretamente com a ONG'
        ],
        estimatedResponseTime: '2-24 horas',
        fees: this.calculateFees(amount)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'PROCESSING_ERROR'
      };
    }
  }

  /**
   * Valida dados do pagamento
   * @param {Object} paymentData - Dados a serem validados
   * @returns {Object} Resultado da validação
   */
  validatePaymentData(paymentData) {
    const { amount, buyer, seller, product } = paymentData;

    if (!amount || amount <= 0) {
      return { isValid: false, error: 'Valor inválido' };
    }

    if (!buyer || !buyer.name || !buyer.phone) {
      return { isValid: false, error: 'Dados do comprador incompletos' };
    }

    if (!seller || !seller.phone) {
      return { isValid: false, error: 'WhatsApp da ONG não disponível' };
    }

    if (!product || !product.name) {
      return { isValid: false, error: 'Produto inválido' };
    }

    // Valida formato do telefone (básico)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(seller.phone.replace(/\D/g, ''))) {
      return { isValid: false, error: 'Número de WhatsApp da ONG inválido' };
    }

    return { isValid: true };
  }

  /**
   * Gera mensagem personalizada para WhatsApp
   * @param {Object} product - Produto
   * @param {Object} buyer - Comprador
   * @param {number} quantity - Quantidade
   * @param {number} amount - Valor total
   * @returns {string} Mensagem formatada
   */
  generateWhatsAppMessage(product, buyer, quantity, amount) {
    const quantityText = quantity > 1 ? `${quantity} unidades` : '1 unidade';
    
    return `Olá! Tenho interesse no produto "${product.name}" do marketplace de ONGs.

👤 Meu nome: ${buyer.name}
📱 Meu telefone: ${buyer.phone}
🛍️ Produto: ${product.name}
📦 Quantidade: ${quantityText}
💰 Valor total: R$ ${amount.toFixed(2)}

Gostaria de saber:
• Formas de pagamento aceitas
• Como funciona a entrega/retirada
• Prazo de disponibilidade

Aguardo seu contato! 😊`;
  }

  /**
   * Gera link do WhatsApp
   * @param {string} phone - Telefone da ONG
   * @param {string} message - Mensagem
   * @returns {string} Link do WhatsApp
   */
  generateWhatsAppLink(phone, message) {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona código do Brasil se necessário
    const fullPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    
    // Codifica mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
  }

  /**
   * Retorna informações sobre o método de pagamento
   * @returns {Object} Informações do método
   */
  getPaymentMethodInfo() {
    return {
      name: 'WhatsApp',
      displayName: 'Negociação via WhatsApp',
      description: 'Entre em contato direto com a ONG para negociar pagamento e entrega',
      icon: 'whatsapp',
      processingTime: 'Imediato (contato)',
      advantages: [
        'Negociação direta com a ONG',
        'Flexibilidade nas formas de pagamento',
        'Esclarecimento de dúvidas em tempo real',
        'Sem taxas de intermediação'
      ],
      requirements: [
        'WhatsApp instalado',
        'Número da ONG disponível'
      ]
    };
  }

  /**
   * Calcula taxas do método de pagamento
   * @param {number} amount - Valor base
   * @returns {Object} Detalhes das taxas
   */
  calculateFees(amount) {
    return {
      platformFee: 0,
      paymentFee: 0,
      totalFees: 0,
      netAmount: amount,
      feePercentage: 0,
      description: 'Sem taxas - negociação direta'
    };
  }

  /**
   * Verifica se o método está disponível
   * @returns {boolean} True se disponível
   */
  isAvailable() {
    // WhatsApp sempre disponível (não depende de configurações externas)
    return true;
  }

  /**
   * Retorna o nome da estratégia
   * @returns {string} Nome da estratégia
   */
  getName() {
    return this.name;
  }
}

module.exports = WhatsAppPaymentStrategy;
