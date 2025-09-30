/**
 * ADAPTER PATTERN - Implementação Simplificada para Mercado Pago
 * Versão compatível que funciona independente da versão do SDK
 */

const PaymentAdapter = require('../../domain/contracts/PaymentAdapter');
const axios = require('axios');
const { logger } = require('../../infra/logger');

class SimpleMercadoPagoAdapter extends PaymentAdapter {
  constructor(accessToken, options = {}) {
    super();
    
    if (!accessToken) {
      throw new Error('MercadoPago access token is required');
    }

    this.accessToken = accessToken;
    this.defaults = {
      backUrls: options.backUrls || null,
      notificationUrl: options.notificationUrl || process.env.MP_NOTIFICATION_URL || `${process.env.BACKEND_URL}/api/donations/webhook`
    };
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

    logger.info('[SIMPLE MP ADAPTER] Inicializado com sucesso');
    logger.debug('[SIMPLE MP ADAPTER] Token usado:', accessToken ? accessToken.substring(0, 6) + '…' : 'n/a');
  }

  /**
   * Cria uma preferência de pagamento único
   */
  async createPaymentPreference(paymentData) {
    try {
      logger.info('[SIMPLE MP] Criando preferência de pagamento');
      logger.debug('[SIMPLE MP] Payload recebido:', paymentData);

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
          success: paymentData.backUrls?.success || this.defaults.backUrls?.success || 'https://www.mercadopago.com.br/checkout/success',
          failure: paymentData.backUrls?.failure || this.defaults.backUrls?.failure || 'https://www.mercadopago.com.br/checkout/failure',
          pending: paymentData.backUrls?.pending || this.defaults.backUrls?.pending || 'https://www.mercadopago.com.br/checkout/pending'
        },
        auto_return: 'approved',
        notification_url: this.defaults.notificationUrl,
        external_reference: paymentData.externalReference || `donation-${Date.now()}`,
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        }
      };

      const response = await this.api.post('/checkout/preferences', preferenceData);
      const result = response.data;
      
      logger.info('[SIMPLE MP] Preferência criada', { id: result.id });

      return {
        id: result.id,
        paymentUrl: result.init_point,
        sandboxUrl: result.sandbox_init_point,
        externalReference: result.external_reference,
        status: 'created'
      };

    } catch (error) {
      logger.error('[SIMPLE MP] Erro ao criar preferência', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`MercadoPagoAdapter/createPaymentPreference failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cria uma assinatura recorrente
   */
  async createSubscription(subscriptionData) {
    try {
      logger.info('[SIMPLE MP] Criando assinatura recorrente');
      logger.debug('[SIMPLE MP] Payload recebido:', subscriptionData);

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
        back_url: 'https://www.mercadopago.com.br',
        external_reference: subscriptionData.externalReference || `subscription-${Date.now()}`,
        status: 'pending'
      };

      logger.debug('[SIMPLE MP] Payload completo sendo enviado:', subscriptionBody);

      const response = await this.api.post('/preapproval', subscriptionBody);
      const result = response.data;
      logger.info('[SIMPLE MP] Assinatura criada', { id: result.id });

      return {
        id: result.id,
        subscriptionUrl: result.init_point,
        sandboxUrl: result.sandbox_init_point,
        externalReference: result.external_reference,
        status: result.status
      };

    } catch (error) {
      logger.error('[SIMPLE MP] Erro ao criar assinatura', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        request: { url: error.config?.url, method: error.config?.method }
      });
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(`MercadoPagoAdapter/createSubscription failed: ${errorMessage}`);
    }
  }

  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(paymentId) {
    try {
      logger.info('[SIMPLE MP] Consultando status do pagamento', { paymentId });

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
        dateApproved: result.date_approved,
        externalReference: result.external_reference
      };

    } catch (error) {
      logger.error('[SIMPLE MP] Erro ao consultar pagamento', error.response?.data || error.message);
      throw new Error(`MercadoPagoAdapter/getPaymentStatus failed: ${error.message}`);
    }
  }

  /**
   * Consulta status de uma assinatura
   */
  async getSubscriptionStatus(subscriptionId) {
    try {
      logger.info('[SIMPLE MP] Consultando status da assinatura', { subscriptionId });

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
      logger.error('[SIMPLE MP] Erro ao consultar assinatura', error.response?.data || error.message);
      throw new Error(`MercadoPagoAdapter/getSubscriptionStatus failed: ${error.message}`);
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId) {
    try {
      logger.info('[SIMPLE MP] Cancelando assinatura', { subscriptionId });

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
      logger.error('[SIMPLE MP] Erro ao cancelar assinatura', error.response?.data || error.message);
      throw new Error(`MercadoPagoAdapter/cancelSubscription failed: ${error.message}`);
    }
  }

  /**
   * Processa webhook de notificação
   */
  async processWebhook(webhookData) {
    try {
      logger.info('[SIMPLE MP] Processando webhook');
      logger.debug('[SIMPLE MP] Webhook data:', webhookData);

      const { type, data } = webhookData;
      
      if (type === 'payment') {
        // Processar notificação de pagamento
        const paymentInfo = await this.getPaymentStatus(data.id);
        
        return {
          type: 'payment',
          paymentId: data.id,
          status: paymentInfo.status,
          amount: paymentInfo.amount,
          externalReference: paymentInfo.externalReference
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
      logger.error('[SIMPLE MP] Erro ao processar webhook', error.response?.data || error.message);
      throw new Error(`MercadoPagoAdapter/processWebhook failed: ${error.message}`);
    }
  }

  /**
   * Valida configuração do adapter
   */
  validateConfiguration() {
    try {
      return !!this.accessToken && (
        this.accessToken.startsWith('TEST-') || this.accessToken.startsWith('APP_USR-')
      );
    } catch (error) {
      logger.error('[SIMPLE MP] Configuração inválida', error);
      return false;
    }
  }

  getProviderName() {
    return 'mercadopago';
  }

  async healthCheck() {
    try {
      // Endpoint simples para validar credenciais
      const res = await this.api.get('/users/me');
      return { success: true, details: { id: res.data?.id, nickname: res.data?.nickname } };
    } catch (error) {
      logger.warn('[SIMPLE MP] Health check falhou', {
        status: error.response?.status,
        data: error.response?.data
      });
      return { success: false, details: error.response?.data || error.message };
    }
  }
}

module.exports = SimpleMercadoPagoAdapter;
