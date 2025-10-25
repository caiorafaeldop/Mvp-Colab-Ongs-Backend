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
      notificationUrl:
        options.notificationUrl ||
        process.env.MP_NOTIFICATION_URL ||
        `${process.env.BACKEND_URL}/api/donations/webhook`,
    };
    this.baseURL = 'https://api.mercadopago.com';

    // Configurar axios com headers padrão
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${Date.now()}-${Math.random()}`, // Evitar duplicação
      },
      timeout: 10000,
    });

    // Validar tipo de token
    const tokenType = accessToken.startsWith('TEST-')
      ? 'TESTE'
      : accessToken.startsWith('APP_USR-')
        ? 'PRODUÇÃO'
        : 'DESCONHECIDO';

    // Verificar se é token brasileiro
    const isBrazilianToken =
      accessToken.includes('5192977059312002') || // Token de teste
      accessToken.includes('2227474609938389'); // Token de produção

    logger.info('[SIMPLE MP ADAPTER] ========================================');
    logger.info('[SIMPLE MP ADAPTER] Inicializado com sucesso');
    logger.info('[SIMPLE MP ADAPTER] Tipo de token:', tokenType);
    logger.info(
      '[SIMPLE MP ADAPTER] Token (primeiros 30 chars):',
      accessToken.substring(0, 30) + '...'
    );
    logger.info('[SIMPLE MP ADAPTER] Token completo (últimos 10):', '...' + accessToken.slice(-10));
    logger.info('[SIMPLE MP ADAPTER] É token brasileiro?', isBrazilianToken ? '✅ SIM' : '❌ NÃO');
    logger.info('[SIMPLE MP ADAPTER] Base URL:', this.baseURL);
    logger.info('[SIMPLE MP ADAPTER] ========================================');
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
            unit_price: paymentData.amount,
          },
        ],
        payer: {
          name: paymentData.payer?.name,
          email: paymentData.payer?.email,
          phone: paymentData.payer?.phone
            ? {
                area_code: paymentData.payer.phone.substring(0, 2),
                number: paymentData.payer.phone.substring(2),
              }
            : undefined,
          identification: paymentData.payer?.document
            ? {
                type: 'CPF',
                number: paymentData.payer.document,
              }
            : undefined,
        },
        back_urls: {
          success:
            paymentData.backUrls?.success ||
            this.defaults.backUrls?.success ||
            'https://www.mercadopago.com.br/checkout/success',
          failure:
            paymentData.backUrls?.failure ||
            this.defaults.backUrls?.failure ||
            'https://www.mercadopago.com.br/checkout/failure',
          pending:
            paymentData.backUrls?.pending ||
            this.defaults.backUrls?.pending ||
            'https://www.mercadopago.com.br/checkout/pending',
        },
        auto_return: 'approved',
        notification_url: this.defaults.notificationUrl,
        external_reference: paymentData.externalReference || `donation-${Date.now()}`,
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12,
        },
      };

      const response = await this.api.post('/checkout/preferences', preferenceData);
      const result = response.data;

      logger.info('[SIMPLE MP] Preferência criada', { id: result.id });

      return {
        id: result.id,
        paymentUrl: result.init_point,
        sandboxUrl: result.sandbox_init_point,
        externalReference: result.external_reference,
        status: 'created',
      };
    } catch (error) {
      logger.error('[SIMPLE MP] Erro ao criar preferência', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        `MercadoPagoAdapter/createPaymentPreference failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Valida se o token está funcionando
   */
  async validateToken() {
    try {
      // Testa com uma chamada simples
      const response = await this.api.get('/preapproval/search?limit=1');
      logger.info('[SIMPLE MP] ✅ Token validado com sucesso');
      return true;
    } catch (error) {
      logger.error('[SIMPLE MP] ❌ Token inválido:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Cria um plano de assinatura (pode ser obrigatório no Brasil)
   * Documentação: https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval_plan/post
   */
  async createSubscriptionPlan(planData) {
    try {
      logger.info('[SIMPLE MP] 📋 Criando plano de assinatura');

      const frequencyMap = {
        monthly: { frequency: 1, frequency_type: 'months' },
        weekly: { frequency: 1, frequency_type: 'weeks' },
        yearly: { frequency: 1, frequency_type: 'years' },
      };

      const frequency = frequencyMap[planData.frequency] || frequencyMap['monthly'];

      const planBody = {
        reason: planData.title || 'Plano de Doação Recorrente',
        auto_recurring: {
          frequency: frequency.frequency,
          frequency_type: frequency.frequency_type,
          transaction_amount: parseFloat(planData.amount),
          currency_id: 'BRL',
        },
        back_url: 'https://www.mercadopago.com.br',
      };

      logger.info('[SIMPLE MP] 📤 Criando plano na API do MP');
      logger.debug('[SIMPLE MP] Plan payload:', JSON.stringify(planBody, null, 2));

      const response = await this.api.post('/preapproval_plan', planBody);
      const result = response.data;

      logger.info('[SIMPLE MP] ✅ Plano criado:', result.id);
      logger.info('[SIMPLE MP] 📋 Resposta completa do plano:');
      logger.info(JSON.stringify(result, null, 2));

      return {
        id: result.id,
        reason: result.reason,
        amount: result.auto_recurring?.transaction_amount,
        frequency: result.auto_recurring?.frequency_type,
        initPoint: result.init_point,
        status: result.status,
        dateCreated: result.date_created,
      };
    } catch (error) {
      logger.error('[SIMPLE MP] ❌ Erro ao criar plano');
      logger.error('[SIMPLE MP] Detalhes:', JSON.stringify(error.response?.data, null, 2));
      throw new Error(`Erro ao criar plano: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cria uma assinatura recorrente (preapproval)
   * Pode usar um plano existente ou criar direto
   * Documentação: https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval/post
   */
  async createSubscription(subscriptionData) {
    try {
      logger.info('[SIMPLE MP] 🔄 Criando assinatura recorrente');
      logger.debug('[SIMPLE MP] Dados recebidos:', {
        amount: subscriptionData.amount,
        frequency: subscriptionData.frequency,
        email: subscriptionData.payer?.email,
      });

      // Testar se o token funciona antes de criar assinatura
      const tokenValid = await this.validateToken();
      if (!tokenValid) {
        throw new Error('Token do Mercado Pago inválido ou sem permissões');
      }

      // TENTAR COM PLANO PRIMEIRO (funciona no Brasil!)
      logger.info('[SIMPLE MP] 🎯 Tentando criar PLANO primeiro...');

      try {
        const plan = await this.createSubscriptionPlan({
          title: subscriptionData.title || 'Doação Recorrente',
          amount: subscriptionData.amount,
          frequency: subscriptionData.frequency,
        });

        logger.info('[SIMPLE MP] ✅ Plano criado com sucesso!');
        logger.info('[SIMPLE MP] 🔗 Agora criando preapproval associado ao plano...');

        // NOVO: Criar preapproval baseado no plano
        const preapprovalBody = {
          preapproval_plan_id: plan.id,
          reason: subscriptionData.title || 'Doação Recorrente',
          payer_email: subscriptionData.payer?.email,
          back_url: subscriptionData.backUrl || 'https://www.mercadopago.com.br',
          external_reference: subscriptionData.externalReference || `donation-${Date.now()}`,
        };

        logger.info('[SIMPLE MP] 📤 Criando preapproval com plan_id');
        logger.debug('[SIMPLE MP] Preapproval payload:', JSON.stringify(preapprovalBody, null, 2));
        const attempts = [0, 1000, 2000, 4000, 8000];
        let lastError = null;
        for (const waitMs of attempts) {
          if (waitMs > 0) {
            await new Promise((r) => setTimeout(r, waitMs));
          }
          try {
            const preapprovalResponse = await this.api.post('/preapproval', preapprovalBody);
            const preapproval = preapprovalResponse.data;
            logger.info('[SIMPLE MP] ✅ Preapproval criado:', preapproval.id);
            logger.info('[SIMPLE MP] 📋 Preapproval completo:');
            logger.info(JSON.stringify(preapproval, null, 2));
            return {
              id: preapproval.id,
              subscriptionUrl: preapproval.init_point,
              sandboxUrl: preapproval.sandbox_init_point,
              externalReference: preapproval.external_reference,
              status: preapproval.status,
              preapprovalPlanId: plan.id,
              dateCreated: preapproval.date_created,
            };
          } catch (err) {
            const msg = err?.response?.data?.message || err.message || '';
            const code = err?.response?.status;
            lastError = err;
            if (
              code === 404 &&
              msg.toLowerCase().includes('template') &&
              msg.toLowerCase().includes('does not exist')
            ) {
              logger.warn('[SIMPLE MP] Plano ainda não propagou. Tentando novamente...');
              continue;
            }
            throw err;
          }
        }
        throw lastError;
      } catch (planError) {
        logger.error('[SIMPLE MP] ❌ Erro ao criar plano/preapproval');
        logger.error('[SIMPLE MP] Erro completo:', planError.message);
        logger.error('[SIMPLE MP] Status:', planError.response?.status);
        logger.error('[SIMPLE MP] Detalhes:', JSON.stringify(planError.response?.data, null, 2));
        logger.warn('[SIMPLE MP] ⚠️ Tentando fluxo sem plano...');
        // Continua para tentar sem plano
      }

      // Mapear frequência para formato do MP
      const frequencyMap = {
        monthly: { frequency: 1, frequency_type: 'months' },
        weekly: { frequency: 1, frequency_type: 'weeks' },
        yearly: { frequency: 1, frequency_type: 'years' },
      };

      const frequency = frequencyMap[subscriptionData.frequency] || frequencyMap['monthly'];

      // Payload COMPLETO baseado na documentação oficial
      const subscriptionBody = {
        // Campos obrigatórios
        reason: subscriptionData.title || 'Doação Recorrente',
        auto_recurring: {
          frequency: frequency.frequency,
          frequency_type: frequency.frequency_type,
          transaction_amount: parseFloat(subscriptionData.amount),
          currency_id: 'BRL',
        },
        payer_email: subscriptionData.payer?.email,
        back_url: subscriptionData.backUrl || 'https://www.mercadopago.com.br',

        // Campos opcionais mas recomendados
        external_reference: subscriptionData.externalReference || `donation-${Date.now()}`,

        // ❌ NÃO enviar "status" na criação! Só em atualização!
        // ❌ NÃO enviar "preapproval_plan_id" aqui - só no fluxo com plano!
      };

      // Log COMPLETO do payload para debug
      logger.info('[SIMPLE MP] 📤 Enviando para API do Mercado Pago');
      logger.info('[SIMPLE MP] ========== PAYLOAD COMPLETO ==========');
      logger.info(JSON.stringify(subscriptionBody, null, 2));
      logger.info('[SIMPLE MP] ========================================');

      // Fazer requisição para criar assinatura
      let result;
      try {
        const response = await this.api.post('/preapproval', subscriptionBody);
        result = response.data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || '';
        const code = err.response?.status;
        if (code === 400 && msg.toLowerCase().includes('different countries')) {
          logger.warn('[SIMPLE MP] Países diferentes detectado. Tentando sem payer_email...');
          const bodyNoEmail = { ...subscriptionBody };
          delete bodyNoEmail.payer_email;
          const response2 = await this.api.post('/preapproval', bodyNoEmail);
          result = response2.data;
        } else {
          throw err;
        }
      }

      // Log da resposta
      logger.info('[SIMPLE MP] ✅ Assinatura criada com sucesso!');
      logger.info('[SIMPLE MP] 📋 Detalhes:', {
        id: result.id,
        status: result.status,
        init_point: result.init_point ? '✓' : '✗',
        external_reference: result.external_reference,
      });

      return {
        id: result.id,
        subscriptionUrl: result.init_point, // URL para checkout
        sandboxUrl: result.sandbox_init_point, // URL para sandbox
        externalReference: result.external_reference,
        status: result.status,
        preapprovalPlanId: result.preapproval_plan_id,
        payerId: result.payer_id,
        nextPaymentDate: result.next_payment_date,
        dateCreated: result.date_created,
      };
    } catch (error) {
      // Log detalhado do erro
      logger.error('[SIMPLE MP] ❌ Erro ao criar assinatura');
      logger.error('[SIMPLE MP] Status:', error.response?.status);
      logger.error('[SIMPLE MP] Mensagem:', error.response?.data?.message || error.message);
      logger.error('[SIMPLE MP] Detalhes:', JSON.stringify(error.response?.data, null, 2));

      // Extrair mensagem de erro amigável
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || error.message;

      const errorCause = error.response?.data?.cause || [];
      const detailedError =
        errorCause.length > 0
          ? `${errorMessage} - ${errorCause.map((c) => c.description).join(', ')}`
          : errorMessage;

      throw new Error(`Erro ao criar assinatura: ${detailedError}`);
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
          identification: result.payer?.identification,
        },
        dateCreated: result.date_created,
        dateApproved: result.date_approved,
        externalReference: result.external_reference,
      };
    } catch (error) {
      logger.error(
        '[SIMPLE MP] Erro ao consultar pagamento',
        error.response?.data || error.message
      );
      throw new Error(`MercadoPagoAdapter/getPaymentStatus failed: ${error.message}`);
    }
  }

  /**
   * Consulta status de uma assinatura
   * Documentação: https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval_id/get
   */
  async getSubscriptionStatus(subscriptionId) {
    try {
      logger.info('[SIMPLE MP] 🔍 Consultando assinatura:', subscriptionId);

      const response = await this.api.get(`/preapproval/${subscriptionId}`);
      const result = response.data;

      logger.info('[SIMPLE MP] ✅ Assinatura encontrada:', {
        id: result.id,
        status: result.status,
        amount: result.auto_recurring?.transaction_amount,
      });

      return {
        id: result.id,
        status: result.status, // pending, authorized, paused, cancelled
        reason: result.reason,
        amount: result.auto_recurring?.transaction_amount,
        frequency: result.auto_recurring?.frequency,
        frequencyType: result.auto_recurring?.frequency_type,
        currencyId: result.auto_recurring?.currency_id,
        payerEmail: result.payer_email,
        payerId: result.payer_id,
        cardId: result.card_id,
        paymentMethodId: result.payment_method_id,
        nextPaymentDate: result.next_payment_date,
        dateCreated: result.date_created,
        lastModified: result.last_modified,
        externalReference: result.external_reference,
        backUrl: result.back_url,
        initPoint: result.init_point,
        // Informações resumidas
        summarized: result.summarized
          ? {
              quotas: result.summarized.quotas,
              chargedQuantity: result.summarized.charged_quantity,
              chargedAmount: result.summarized.charged_amount,
              pendingChargeQuantity: result.summarized.pending_charge_quantity,
              pendingChargeAmount: result.summarized.pending_charge_amount,
              lastChargedDate: result.summarized.last_charged_date,
              lastChargedAmount: result.summarized.last_charged_amount,
              semaphore: result.summarized.semaphore,
            }
          : null,
      };
    } catch (error) {
      logger.error('[SIMPLE MP] ❌ Erro ao consultar assinatura');
      logger.error('[SIMPLE MP] Status:', error.response?.status);
      logger.error('[SIMPLE MP] Detalhes:', error.response?.data);

      throw new Error(
        `Erro ao consultar assinatura: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Atualiza uma assinatura (pausar/reativar/alterar valor/frequência)
   * Documentação: https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval_id/put
   */
  async updateSubscription(subscriptionId, options = {}) {
    try {
      logger.info('[SIMPLE MP] ✏️ Atualizando assinatura:', subscriptionId);
      logger.debug('[SIMPLE MP] Opções:', options);

      const updateBody = {};

      // Atualizar status (pausar/reativar)
      if (options.status) {
        updateBody.status = options.status; // 'paused', 'authorized', 'cancelled'
        logger.info('[SIMPLE MP] 🔄 Alterando status para:', options.status);
      }

      // Atualizar valor ou frequência
      if (options.amount || options.frequency) {
        updateBody.auto_recurring = {};

        if (options.amount) {
          updateBody.auto_recurring.transaction_amount = parseFloat(options.amount);
          updateBody.auto_recurring.currency_id = 'BRL';
          logger.info('[SIMPLE MP] 💰 Alterando valor para:', options.amount);
        }

        if (options.frequency) {
          // Mapear frequência
          const frequencyMap = {
            monthly: { frequency: 1, frequency_type: 'months' },
            weekly: { frequency: 1, frequency_type: 'weeks' },
            yearly: { frequency: 1, frequency_type: 'years' },
          };

          const freq = frequencyMap[options.frequency];
          if (freq) {
            updateBody.auto_recurring.frequency = freq.frequency;
            updateBody.auto_recurring.frequency_type = freq.frequency_type;
            logger.info('[SIMPLE MP] 📅 Alterando frequência para:', options.frequency);
          }
        }
      }

      // Atualizar reason (motivo)
      if (options.reason) {
        updateBody.reason = options.reason;
      }

      // Atualizar external_reference
      if (options.externalReference) {
        updateBody.external_reference = options.externalReference;
      }

      logger.debug('[SIMPLE MP] 📤 Payload de atualização:', JSON.stringify(updateBody, null, 2));

      const response = await this.api.put(`/preapproval/${subscriptionId}`, updateBody);
      const result = response.data;

      logger.info('[SIMPLE MP] ✅ Assinatura atualizada com sucesso!');
      logger.info('[SIMPLE MP] 📋 Novos dados:', {
        id: result.id,
        status: result.status,
        amount: result.auto_recurring?.transaction_amount,
        frequency: result.auto_recurring?.frequency_type,
      });

      return {
        id: result.id,
        status: result.status,
        amount: result.auto_recurring?.transaction_amount,
        frequency: result.auto_recurring?.frequency_type,
        lastModified: result.last_modified,
        updated: true,
      };
    } catch (error) {
      logger.error('[SIMPLE MP] ❌ Erro ao atualizar assinatura');
      logger.error('[SIMPLE MP] Status:', error.response?.status);
      logger.error('[SIMPLE MP] Detalhes:', JSON.stringify(error.response?.data, null, 2));

      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Erro ao atualizar assinatura: ${errorMessage}`);
    }
  }

  /**
   * Cancela uma assinatura
   * Documentação: https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval_id/put
   */
  async cancelSubscription(subscriptionId) {
    try {
      logger.info('[SIMPLE MP] 🚫 Cancelando assinatura:', subscriptionId);

      const response = await this.api.put(`/preapproval/${subscriptionId}`, {
        status: 'cancelled',
      });
      const result = response.data;

      logger.info('[SIMPLE MP] ✅ Assinatura cancelada com sucesso!');
      logger.info('[SIMPLE MP] 📋 Status final:', result.status);

      return {
        id: result.id,
        status: result.status,
        lastModified: result.last_modified,
        cancelled: true,
      };
    } catch (error) {
      logger.error('[SIMPLE MP] ❌ Erro ao cancelar assinatura');
      logger.error('[SIMPLE MP] Status:', error.response?.status);
      logger.error('[SIMPLE MP] Detalhes:', error.response?.data);

      throw new Error(
        `Erro ao cancelar assinatura: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Busca assinaturas com filtros
   * Documentação: https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapproval_search/get
   */
  async searchSubscriptions(filters = {}) {
    try {
      logger.info('[SIMPLE MP] 🔎 Buscando assinaturas');
      logger.debug('[SIMPLE MP] Filtros:', filters);

      // Construir query params
      const params = new URLSearchParams();

      if (filters.payerEmail) {
        params.append('payer_email', filters.payerEmail);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.externalReference) {
        params.append('external_reference', filters.externalReference);
      }
      if (filters.limit) {
        params.append('limit', filters.limit);
      }
      if (filters.offset) {
        params.append('offset', filters.offset);
      }

      const response = await this.api.get(`/preapproval/search?${params.toString()}`);
      const result = response.data;

      logger.info('[SIMPLE MP] ✅ Busca concluída:', {
        total: result.paging?.total || 0,
        results: result.results?.length || 0,
      });

      return {
        paging: result.paging,
        results: result.results || [],
      };
    } catch (error) {
      logger.error('[SIMPLE MP] ❌ Erro ao buscar assinaturas');
      logger.error('[SIMPLE MP] Detalhes:', error.response?.data);

      throw new Error(
        `Erro ao buscar assinaturas: ${error.response?.data?.message || error.message}`
      );
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
          externalReference: paymentInfo.externalReference,
        };
      } else if (type === 'preapproval') {
        // Processar notificação de assinatura
        const subscriptionInfo = await this.getSubscriptionStatus(data.id);

        return {
          type: 'subscription',
          subscriptionId: data.id,
          status: subscriptionInfo.status,
          amount: subscriptionInfo.amount,
        };
      }

      return {
        type: 'unknown',
        data: webhookData,
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
      return (
        !!this.accessToken &&
        (this.accessToken.startsWith('TEST-') || this.accessToken.startsWith('APP_USR-'))
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
        data: error.response?.data,
      });
      return { success: false, details: error.response?.data || error.message };
    }
  }
}

module.exports = SimpleMercadoPagoAdapter;
