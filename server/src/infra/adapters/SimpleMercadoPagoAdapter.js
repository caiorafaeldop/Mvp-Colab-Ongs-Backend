/**
 * ADAPTER PATTERN - Implementação Simplificada para Mercado Pago
 * Versão compatível que funciona independente da versão do SDK
 */

const PaymentAdapter = require('../../domain/contracts/PaymentAdapter');
const axios = require('axios');

class SimpleMercadoPagoAdapter extends PaymentAdapter {
  constructor(accessToken) {
    super();
    
    if (!accessToken) {
      throw new Error('MercadoPago access token is required');
    }

    this.accessToken = accessToken;
    this.baseURL = 'https://api.mercadopago.com';
    
    // Configurar axios com headers padrão
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('[SIMPLE MP ADAPTER] Inicializado com sucesso');
  }

  /**
   * Cria uma preferência de pagamento único
   */
  async createPaymentPreference(paymentData) {
    try {
      console.log('[SIMPLE MP] Criando preferência de pagamento:', paymentData);

      const preferenceData = {
        items: [
          {
            id: `donation-${Date.now()}`,
            title: paymentData.title || 'Doação',
            description: paymentData.description || 'Doação para ONG',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: paymentData.amount
          }
        ],
        payer: {
          name: paymentData.payer?.name,
          email: paymentData.payer?.email,
          phone: paymentData.payer?.phone ? {
            area_code: paymentData.payer.phone.substring(0, 2),
            number: paymentData.payer.phone.substring(2)
          } : undefined,
          identification: paymentData.payer?.document ? {
            type: 'CPF',
            number: paymentData.payer.document
          } : undefined
        },
        back_urls: {
          success: paymentData.backUrls?.success || 'https://www.mercadopago.com.br/checkout/success',
          failure: paymentData.backUrls?.failure || 'https://www.mercadopago.com.br/checkout/failure',
          pending: paymentData.backUrls?.pending || 'https://www.mercadopago.com.br/checkout/pending'
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/api/donations/webhook`,
        external_reference: paymentData.externalReference || `donation-${Date.now()}`,
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        }
      };

      const response = await this.api.post('/checkout/preferences', preferenceData);
      const result = response.data;
      
      console.log('[SIMPLE MP] Preferência criada:', {
        id: result.id,
        init_point: result.init_point
      });

      return {
        id: result.id,
        paymentUrl: result.init_point,
        sandboxUrl: result.sandbox_init_point,
        externalReference: result.external_reference,
        status: 'created'
      };

    } catch (error) {
      console.error('[SIMPLE MP] Erro ao criar preferência:');
      console.error('Status:', error.response?.status);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Message:', error.message);
      throw new Error(`Erro ao criar preferência de pagamento: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cria uma assinatura recorrente
   */
  async createSubscription(subscriptionData) {
    try {
      console.log('[SIMPLE MP] Criando assinatura recorrente:', subscriptionData);

      // Mapear frequência
      const frequencyMap = {
        'monthly': { frequency: 1, frequency_type: 'months' },
        'weekly': { frequency: 1, frequency_type: 'weeks' },
        'yearly': { frequency: 1, frequency_type: 'years' }
      };

      const frequency = frequencyMap[subscriptionData.frequency] || frequencyMap['monthly'];

      const subscriptionBody = {
        reason: subscriptionData.title || 'Doação Recorrente',
        auto_recurring: {
          frequency: frequency.frequency,
          frequency_type: frequency.frequency_type,
          transaction_amount: subscriptionData.amount,
          currency_id: 'BRL'
        },
        payer_email: subscriptionData.payer?.email,
        back_url: subscriptionData.backUrls?.success || `${process.env.FRONTEND_URL}/donation/success`,
        external_reference: subscriptionData.externalReference || `subscription-${Date.now()}`,
        status: 'pending'
      };

      const response = await this.api.post('/preapproval', subscriptionBody);
      const result = response.data;
      
      console.log('[SIMPLE MP] Assinatura criada:', {
        id: result.id,
        init_point: result.init_point
      });

      return {
        id: result.id,
        subscriptionUrl: result.init_point,
        sandboxUrl: result.sandbox_init_point,
        externalReference: result.external_reference,
        status: result.status
      };

    } catch (error) {
      console.error('[SIMPLE MP] Erro ao criar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao criar assinatura: ${error.message}`);
    }
  }

  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(paymentId) {
    try {
      console.log('[SIMPLE MP] Consultando status do pagamento:', paymentId);

      const response = await this.api.get(`/v1/payments/${paymentId}`);
      const result = response.data;
      
      return {
        id: result.id,
        status: result.status,
        statusDetail: result.status_detail,
        amount: result.transaction_amount,
        paymentMethod: result.payment_method_id,
        payer: {
          email: result.payer?.email,
          identification: result.payer?.identification
        },
        dateCreated: result.date_created,
        dateApproved: result.date_approved
      };

    } catch (error) {
      console.error('[SIMPLE MP] Erro ao consultar pagamento:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar pagamento: ${error.message}`);
    }
  }

  /**
   * Consulta status de uma assinatura
   */
  async getSubscriptionStatus(subscriptionId) {
    try {
      console.log('[SIMPLE MP] Consultando status da assinatura:', subscriptionId);

      const response = await this.api.get(`/preapproval/${subscriptionId}`);
      const result = response.data;
      
      return {
        id: result.id,
        status: result.status,
        reason: result.reason,
        amount: result.auto_recurring?.transaction_amount,
        frequency: result.auto_recurring?.frequency_type,
        payerEmail: result.payer_email,
        dateCreated: result.date_created,
        lastModified: result.last_modified
      };

    } catch (error) {
      console.error('[SIMPLE MP] Erro ao consultar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar assinatura: ${error.message}`);
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId) {
    try {
      console.log('[SIMPLE MP] Cancelando assinatura:', subscriptionId);

      const response = await this.api.put(`/preapproval/${subscriptionId}`, {
        status: 'cancelled'
      });
      const result = response.data;
      
      return {
        id: result.id,
        status: result.status,
        cancelled: true
      };

    } catch (error) {
      console.error('[SIMPLE MP] Erro ao cancelar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao cancelar assinatura: ${error.message}`);
    }
  }

  /**
   * Processa webhook de notificação
   */
  async processWebhook(webhookData) {
    try {
      console.log('[SIMPLE MP] Processando webhook:', webhookData);

      const { type, data } = webhookData;
      
      if (type === 'payment') {
        // Processar notificação de pagamento
        const paymentInfo = await this.getPaymentStatus(data.id);
        
        return {
          type: 'payment',
          paymentId: data.id,
          status: paymentInfo.status,
          amount: paymentInfo.amount,
          externalReference: paymentInfo.external_reference
        };
        
      } else if (type === 'preapproval') {
        // Processar notificação de assinatura
        const subscriptionInfo = await this.getSubscriptionStatus(data.id);
        
        return {
          type: 'subscription',
          subscriptionId: data.id,
          status: subscriptionInfo.status,
          amount: subscriptionInfo.amount
        };
      }

      return {
        type: 'unknown',
        data: webhookData
      };

    } catch (error) {
      console.error('[SIMPLE MP] Erro ao processar webhook:', error.response?.data || error.message);
      throw new Error(`Erro ao processar webhook: ${error.message}`);
    }
  }

  /**
   * Valida configuração do adapter
   */
  validateConfiguration() {
    try {
      return !!this.accessToken && this.accessToken.startsWith('TEST-');
    } catch (error) {
      console.error('[SIMPLE MP] Configuração inválida:', error);
      return false;
    }
  }
}

module.exports = SimpleMercadoPagoAdapter;
