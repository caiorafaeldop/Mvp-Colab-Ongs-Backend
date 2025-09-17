const INotificationBridge = require('../../domain/bridges/INotificationBridge');

/**
 * Bridge para Email Notifications
 * Implementação para envio de notificações por email
 */
class EmailNotificationBridge extends INotificationBridge {
  constructor(emailAdapter) {
    super();
    this.adapter = emailAdapter;
    this.channelName = 'Email';
  }

  /**
   * Envia notificação por email
   * @param {Object} notification - Dados da notificação
   * @param {Object} recipient - Destinatário
   * @param {Object} options - Opções de envio
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendNotification(notification, recipient, options = {}) {
    try {
      console.log(`[EmailNotificationBridge] Enviando email para: ${recipient.email}`);

      if (!this.validateRecipient(recipient)) {
        throw new Error('Email do destinatário inválido');
      }

      const emailData = {
        to: recipient.email,
        subject: notification.title || 'Notificação do Marketplace ONGs',
        html: this.buildEmailTemplate(notification, recipient, options),
        text: notification.message || notification.body,
        from: options.from || process.env.EMAIL_FROM || 'noreply@marketplace-ongs.com'
      };

      // Adiciona anexos se fornecidos
      if (options.attachments) {
        emailData.attachments = options.attachments;
      }

      const result = await this.adapter.sendEmail(emailData);

      console.log(`[EmailNotificationBridge] Email enviado: ${result.messageId}`);

      return {
        success: true,
        notificationId: result.messageId,
        channel: this.channelName,
        recipient: recipient.email,
        sentAt: new Date().toISOString(),
        provider: this.adapter.getProviderName?.() || 'Unknown'
      };

    } catch (error) {
      console.error('[EmailNotificationBridge] Erro no envio:', error.message);
      throw new Error(`Email sending failed: ${error.message}`);
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
      console.log(`[EmailNotificationBridge] Enviando email em lote para ${recipients.length} destinatários`);

      const validRecipients = recipients.filter(r => this.validateRecipient(r));
      
      if (validRecipients.length === 0) {
        throw new Error('Nenhum destinatário válido encontrado');
      }

      const results = [];
      const batchSize = options.batchSize || 50;

      // Processa em lotes para evitar sobrecarga
      for (let i = 0; i < validRecipients.length; i += batchSize) {
        const batch = validRecipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient) => {
          try {
            const result = await this.sendNotification(notification, recipient, options);
            return { success: true, recipient: recipient.email, result };
          } catch (error) {
            return { success: false, recipient: recipient.email, error: error.message };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Delay entre lotes se especificado
        if (options.delayBetweenBatches && i + batchSize < validRecipients.length) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      console.log(`[EmailNotificationBridge] Lote concluído: ${successful.length}/${recipients.length} sucessos`);

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
      console.error('[EmailNotificationBridge] Erro no envio em lote:', error.message);
      throw new Error(`Bulk email sending failed: ${error.message}`);
    }
  }

  /**
   * Verifica status de entrega
   * @param {string} notificationId - ID da notificação
   * @returns {Promise<Object>} Status da entrega
   */
  async getDeliveryStatus(notificationId) {
    try {
      // Implementação dependeria do provedor de email
      // Por exemplo, SendGrid, Mailgun, etc. têm APIs específicas
      
      return {
        notificationId,
        channel: this.channelName,
        status: 'unknown',
        message: 'Status tracking not implemented for this email provider',
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('[EmailNotificationBridge] Erro ao verificar status:', error.message);
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
      type: 'email',
      features: [
        'html_content',
        'attachments',
        'bulk_sending',
        'templates',
        'personalization'
      ],
      limitations: {
        maxRecipients: 1000,
        maxAttachmentSize: '25MB',
        rateLimit: '100 emails/minute'
      },
      deliveryTime: '1-5 minutes',
      reliability: 'high'
    };
  }

  /**
   * Valida destinatário para email
   * @param {Object} recipient - Destinatário
   * @returns {boolean} True se válido
   */
  validateRecipient(recipient) {
    if (!recipient || !recipient.email) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(recipient.email);
  }

  /**
   * Constrói template HTML do email
   * @param {Object} notification - Dados da notificação
   * @param {Object} recipient - Destinatário
   * @param {Object} options - Opções
   * @returns {string} HTML do email
   */
  buildEmailTemplate(notification, recipient, options = {}) {
    const template = options.template || 'default';

    switch (template) {
      case 'product_purchase':
        return this.buildPurchaseTemplate(notification, recipient);
      case 'welcome':
        return this.buildWelcomeTemplate(notification, recipient);
      case 'password_reset':
        return this.buildPasswordResetTemplate(notification, recipient);
      default:
        return this.buildDefaultTemplate(notification, recipient);
    }
  }

  /**
   * Template padrão
   */
  buildDefaultTemplate(notification, recipient) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 10px 20px; background: #2c5aa0; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Marketplace ONGs</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>Olá ${recipient.name || recipient.email},</p>
            <p>${notification.message || notification.body}</p>
            ${notification.actionUrl ? `<p><a href="${notification.actionUrl}" class="button">Ver Detalhes</a></p>` : ''}
          </div>
          <div class="footer">
            <p>Marketplace ONGs - Conectando causas e pessoas</p>
            <p>Se você não deseja mais receber esses emails, <a href="#">clique aqui</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template de compra
   */
  buildPurchaseTemplate(notification, recipient) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Compra Realizada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .product { border: 1px solid #ddd; padding: 15px; margin: 10px 0; background: white; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Compra Confirmada!</h1>
          </div>
          <div class="content">
            <p>Olá ${recipient.name || recipient.email},</p>
            <p>Sua compra foi realizada com sucesso!</p>
            <div class="product">
              <h3>${notification.productName}</h3>
              <p>Valor: R$ ${notification.price}</p>
              <p>ONG: ${notification.organizationName}</p>
            </div>
            <p>Obrigado por apoiar nossa causa!</p>
          </div>
          <div class="footer">
            <p>Marketplace ONGs - Conectando causas e pessoas</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template de boas-vindas
   */
  buildWelcomeTemplate(notification, recipient) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo ao Marketplace ONGs</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 10px 20px; background: #17a2b8; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo!</h1>
          </div>
          <div class="content">
            <p>Olá ${recipient.name || recipient.email},</p>
            <p>Seja bem-vindo ao Marketplace ONGs!</p>
            <p>Aqui você pode descobrir produtos incríveis de organizações que fazem a diferença.</p>
            <p><a href="${notification.actionUrl || '#'}" class="button">Explorar Produtos</a></p>
          </div>
          <div class="footer">
            <p>Marketplace ONGs - Conectando causas e pessoas</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template de reset de senha
   */
  buildPasswordResetTemplate(notification, recipient) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Redefinir Senha</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Redefinir Senha</h1>
          </div>
          <div class="content">
            <p>Olá ${recipient.name || recipient.email},</p>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <div class="warning">
              <p><strong>⚠️ Importante:</strong> Este link expira em 1 hora.</p>
            </div>
            <p><a href="${notification.resetUrl}" class="button">Redefinir Senha</a></p>
            <p>Se você não solicitou esta alteração, ignore este email.</p>
          </div>
          <div class="footer">
            <p>Marketplace ONGs - Conectando causas e pessoas</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailNotificationBridge;
