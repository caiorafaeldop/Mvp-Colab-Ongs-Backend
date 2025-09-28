const INotificationBridge = require('../../domain/bridges/INotificationBridge');

/**
 * Bridge para WhatsApp Notifications
 * Implementação para envio de notificações via WhatsApp
 */
class WhatsAppNotificationBridge extends INotificationBridge {
  constructor(whatsappAdapter) {
    super();
    this.adapter = whatsappAdapter;
    this.channelName = 'WhatsApp';
  }

  /**
   * Envia notificação via WhatsApp
   * @param {Object} notification - Dados da notificação
   * @param {Object} recipient - Destinatário
   * @param {Object} options - Opções de envio
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendNotification(notification, recipient, options = {}) {
    try {
      console.log(`[WhatsAppNotificationBridge] Enviando WhatsApp para: ${recipient.phone}`);

      if (!this.validateRecipient(recipient)) {
        throw new Error('Número de telefone do destinatário inválido');
      }

      const messageData = {
        to: this.formatPhoneNumber(recipient.phone),
        message: this.buildMessage(notification, recipient, options),
        type: options.messageType || 'text'
      };

      // Adiciona mídia se fornecida
      if (options.media) {
        messageData.media = options.media;
        messageData.type = 'media';
      }

      const result = await this.adapter.sendMessage(messageData);

      console.log(`[WhatsAppNotificationBridge] WhatsApp enviado: ${result.messageId}`);

      return {
        success: true,
        notificationId: result.messageId,
        channel: this.channelName,
        recipient: recipient.phone,
        sentAt: new Date().toISOString(),
        provider: this.adapter.getProviderName?.() || 'Unknown'
      };

    } catch (error) {
      console.error('[WhatsAppNotificationBridge] Erro no envio:', error.message);
      throw new Error(`WhatsApp sending failed: ${error.message}`);
    }
  }

  /**
   * Envia notificação em lote
   * @param {Object} notification - Dados da notificação
   * @param {Array} recipients - Lista de destinatários
   * @param {Object} options - Opções de envio
   * @returns {Promise<Object>} Resultado do envio em lote
   */
  async sendBulkNotification(notification, recipients, options = {}) {
    try {
      console.log(`[WhatsAppNotificationBridge] Enviando WhatsApp em lote para ${recipients.length} destinatários`);

      const validRecipients = recipients.filter(r => this.validateRecipient(r));
      
      if (validRecipients.length === 0) {
        throw new Error('Nenhum destinatário válido encontrado');
      }

      const results = [];
      const batchSize = options.batchSize || 20; // WhatsApp tem limites mais restritivos
      const delayBetweenMessages = options.delayBetweenMessages || 1000; // 1 segundo entre mensagens

      // Processa em lotes menores devido às limitações do WhatsApp
      for (let i = 0; i < validRecipients.length; i += batchSize) {
        const batch = validRecipients.slice(i, i + batchSize);
        
        for (const recipient of batch) {
          try {
            const result = await this.sendNotification(notification, recipient, options);
            results.push({ success: true, recipient: recipient.phone, result });
            
            // Delay entre mensagens para evitar rate limiting
            if (delayBetweenMessages > 0) {
              await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
            }
          } catch (error) {
            results.push({ success: false, recipient: recipient.phone, error: error.message });
          }
        }

        // Delay maior entre lotes
        if (options.delayBetweenBatches && i + batchSize < validRecipients.length) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      console.log(`[WhatsAppNotificationBridge] Lote concluído: ${successful.length}/${recipients.length} sucessos`);

      return {
        success: failed.length === 0,
        channel: this.channelName,
        totalRecipients: recipients.length,
        validRecipients: validRecipients.length,
        successful: successful.length,
        failed: failed.length,
        results: results,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('[WhatsAppNotificationBridge] Erro no envio em lote:', error.message);
      throw new Error(`Bulk WhatsApp sending failed: ${error.message}`);
    }
  }

  /**
   * Verifica status de entrega
   * @param {string} notificationId - ID da notificação
   * @returns {Promise<Object>} Status da entrega
   */
  async getDeliveryStatus(notificationId) {
    try {
      if (this.adapter.getMessageStatus) {
        const status = await this.adapter.getMessageStatus(notificationId);
        
        return {
          notificationId,
          channel: this.channelName,
          status: status.status,
          deliveredAt: status.deliveredAt,
          readAt: status.readAt,
          checkedAt: new Date().toISOString()
        };
      }

      return {
        notificationId,
        channel: this.channelName,
        status: 'unknown',
        message: 'Status tracking not available for this WhatsApp provider',
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('[WhatsAppNotificationBridge] Erro ao verificar status:', error.message);
      return {
        notificationId,
        channel: this.channelName,
        status: 'error',
        error: error.message,
        checkedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Obtém informações do canal
   * @returns {Object} Informações do canal
   */
  getChannelInfo() {
    return {
      name: this.channelName,
      type: 'messaging',
      features: [
        'text_messages',
        'media_messages',
        'delivery_status',
        'read_receipts',
        'instant_delivery'
      ],
      limitations: {
        maxRecipients: 1000,
        maxMessageLength: 4096,
        rateLimit: '20 messages/minute',
        mediaSize: '16MB'
      },
      deliveryTime: 'Instant',
      reliability: 'very_high'
    };
  }

  /**
   * Valida destinatário para WhatsApp
   * @param {Object} recipient - Destinatário
   * @returns {boolean} True se válido
   */
  validateRecipient(recipient) {
    if (!recipient || !recipient.phone) {
      return false;
    }

    // Remove caracteres não numéricos
    const cleanPhone = recipient.phone.replace(/\D/g, '');
    
    // Verifica se tem pelo menos 10 dígitos (formato mínimo internacional)
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  /**
   * Formata número de telefone para WhatsApp
   * @param {string} phone - Número de telefone
   * @returns {string} Número formatado
   */
  formatPhoneNumber(phone) {
    // Remove caracteres não numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver (assume Brasil +55)
    if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
      cleanPhone = '55' + cleanPhone;
    } else if (cleanPhone.length === 10) {
      cleanPhone = '5511' + cleanPhone;
    } else if (!cleanPhone.startsWith('55') && cleanPhone.length < 13) {
      cleanPhone = '55' + cleanPhone;
    }

    return cleanPhone;
  }

  /**
   * Constrói mensagem para WhatsApp
   * @param {Object} notification - Dados da notificação
   * @param {Object} recipient - Destinatário
   * @param {Object} options - Opções
   * @returns {string} Mensagem formatada
   */
  buildMessage(notification, recipient, options = {}) {
    const template = options.template || 'default';

    switch (template) {
      case 'product_purchase':
        return this.buildPurchaseMessage(notification, recipient);
      case 'welcome':
        return this.buildWelcomeMessage(notification, recipient);
      case 'order_update':
        return this.buildOrderUpdateMessage(notification, recipient);
      case 'payment_link':
        return this.buildPaymentLinkMessage(notification, recipient);
      default:
        return this.buildDefaultMessage(notification, recipient);
    }
  }

  /**
   * Mensagem padrão
   */
  buildDefaultMessage(notification, recipient) {
    const name = recipient.name || 'Cliente';
    return `🏪 *Marketplace ONGs*\n\nOlá ${name}!\n\n${notification.message || notification.body}\n\n_Obrigado por apoiar nossas causas!_ 💚`;
  }

  /**
   * Mensagem de compra
   */
  buildPurchaseMessage(notification, recipient) {
    const name = recipient.name || 'Cliente';
    return `✅ *Compra Confirmada!*\n\nOlá ${name}!\n\nSua compra foi realizada com sucesso:\n\n📦 *Produto:* ${notification.productName}\n💰 *Valor:* R$ ${notification.price}\n🏢 *ONG:* ${notification.organizationName}\n\nObrigado por apoiar nossa causa! 💚\n\n_Marketplace ONGs_`;
  }

  /**
   * Mensagem de boas-vindas
   */
  buildWelcomeMessage(notification, recipient) {
    const name = recipient.name || 'Cliente';
    return `🎉 *Bem-vindo ao Marketplace ONGs!*\n\nOlá ${name}!\n\nSeja bem-vindo à nossa plataforma! Aqui você encontra produtos incríveis de organizações que fazem a diferença.\n\n🛍️ Explore nossos produtos e apoie causas importantes!\n\n_Conectando causas e pessoas_ 💚`;
  }

  /**
   * Mensagem de atualização de pedido
   */
  buildOrderUpdateMessage(notification, recipient) {
    const name = recipient.name || 'Cliente';
    const status = notification.status || 'atualizado';
    return `📋 *Atualização do Pedido*\n\nOlá ${name}!\n\nSeu pedido foi ${status}:\n\n🆔 *Pedido:* #${notification.orderId}\n📦 *Produto:* ${notification.productName}\n📊 *Status:* ${notification.statusDescription}\n\n_Marketplace ONGs_ 💚`;
  }

  /**
   * Mensagem de link de pagamento
   */
  buildPaymentLinkMessage(notification, recipient) {
    const name = recipient.name || 'Cliente';
    return `💳 *Link de Pagamento*\n\nOlá ${name}!\n\nSeu link de pagamento está pronto:\n\n📦 *Produto:* ${notification.productName}\n💰 *Valor:* R$ ${notification.price}\n\n🔗 *Pagar via WhatsApp:*\n${notification.paymentUrl}\n\n_Clique no link para finalizar sua compra!_ 💚\n\n_Marketplace ONGs_`;
  }
}

module.exports = WhatsAppNotificationBridge;
