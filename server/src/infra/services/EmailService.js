const nodemailer = require('nodemailer');
const https = require('https');
const { logger } = require('../logger');

/**
 * Serviço de envio de emails
 * Usa Nodemailer para enviar emails de verificação e recuperação de senha
 */
class EmailService {
  constructor() {
    // Configurar transporter do Nodemailer
    // Para desenvolvimento, usar Ethereal Email (email de teste)
    // Para produção, configurar com SMTP real (Gmail, SendGrid, etc.)
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Inicializar o serviço de email
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Detectar se tem SendGrid API Key (preferir API no Render)
      this.sendgridApiKey = process.env.SENDGRID_API_KEY;
      this.useSendGridAPI = !!this.sendgridApiKey && process.env.USE_SENDGRID_API !== 'false';

      if (this.useSendGridAPI) {
        logger.info('EmailService inicializado com SendGrid API (HTTP)', {
          isRender: !!process.env.RENDER,
          apiKeyPresent: !!this.sendgridApiKey,
        });
        this.initialized = true;
        return;
      }

      // Fallback para SMTP
      const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
      const user = process.env.MAIL_USERNAME || process.env.SMTP_USER;
      const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
      const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587');
      const secure = (process.env.MAIL_SECURE || process.env.SMTP_SECURE) === 'true';

      if (!host || !user || !pass) {
        const msg =
          'Email não configurado. Defina SENDGRID_API_KEY ou MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD.';
        logger.error(msg, { host, userPresent: !!user, passPresent: !!pass });
        throw new Error(msg);
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 7000,
        greetingTimeout: 7000,
        socketTimeout: 12000,
      });

      logger.info('EmailService inicializado com SMTP', {
        host,
        port,
        secure,
        userConfigured: !!user,
      });

      this.initialized = true;
    } catch (error) {
      logger.error('Erro ao inicializar EmailService', { error: error.message });
      throw error;
    }
  }

  /**
   * Tentar enviar email com retry e backoff
   */
  async sendEmailWithRetry(mailOptions, maxRetries = 3) {
    let lastError;

    console.log(`\n${'🔄'.repeat(40)}`);
    console.log(`[EMAIL RETRY] Iniciando envio com retry para: ${mailOptions.to}`);
    console.log(`${'🔄'.repeat(40)}\n`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`\n⏳ [TENTATIVA ${attempt}/${maxRetries}] Enviando para: ${mailOptions.to}`);

        logger.info(`[EMAIL RETRY] Tentativa ${attempt}/${maxRetries}`, {
          to: mailOptions.to,
        });

        // Timeout progressivo: 5s, 8s, 12s
        const timeout = 5000 + (attempt - 1) * 3000;
        console.log(`   Timeout configurado: ${timeout}ms`);

        const startTime = Date.now();
        const info = await Promise.race([
          this.transporter.sendMail(mailOptions),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Timeout na tentativa ${attempt} (${timeout}ms)`)),
              timeout
            )
          ),
        ]);
        const duration = Date.now() - startTime;

        console.log(`\n✅ [SUCESSO NA TENTATIVA ${attempt}!]`);
        console.log(`   Duração: ${duration}ms`);
        console.log(`   MessageId: ${info.messageId}`);

        logger.info(`[EMAIL RETRY] ✅ Sucesso na tentativa ${attempt}!`, {
          to: mailOptions.to,
          messageId: info.messageId,
          duration,
        });

        return info;
      } catch (error) {
        lastError = error;

        console.log(`\n❌ [FALHA NA TENTATIVA ${attempt}/${maxRetries}]`);
        console.log(`   Erro: ${error.message}`);

        logger.warn(`[EMAIL RETRY] ❌ Falha na tentativa ${attempt}/${maxRetries}`, {
          to: mailOptions.to,
          error: error.message,
        });

        // Se não for a última tentativa, aguardar antes de retry
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s
          console.log(`   ⏳ Aguardando ${backoffMs}ms antes do retry...\n`);
          logger.info(`[EMAIL RETRY] Aguardando ${backoffMs}ms antes do retry...`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    // Se todas as tentativas falharam, tentar fallback para Ethereal
    console.log(`\n${'🚨'.repeat(40)}`);
    console.log(`[FALLBACK ETHEREAL] Todas tentativas SMTP falharam!`);
    console.log(`[FALLBACK ETHEREAL] Tentando enviar via Ethereal...`);
    console.log(`${'🚨'.repeat(40)}\n`);

    logger.warn('[EMAIL RETRY] Todas tentativas falharam, tentando fallback Ethereal...', {
      to: mailOptions.to,
    });

    try {
      console.log(`⏳ Criando conta Ethereal temporária...`);
      const fallbackTransporter = await this.createEtherealFallback();

      console.log(`⏳ Enviando email via Ethereal...`);
      const info = await fallbackTransporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log(`\n✅ [FALLBACK ETHEREAL FUNCIONOU!]`);
      console.log(`   MessageId: ${info.messageId}`);
      console.log(`   Preview URL: ${previewUrl}`);
      console.log(`\n${'🎉'.repeat(40)}\n`);

      logger.info('[EMAIL RETRY] ✅ Fallback Ethereal funcionou!', {
        to: mailOptions.to,
        previewUrl,
      });

      return { ...info, previewUrl, usedFallback: true };
    } catch (fallbackError) {
      console.log(`\n❌ [FALLBACK ETHEREAL TAMBÉM FALHOU!]`);
      console.log(`   Erro: ${fallbackError.message}`);
      console.log(`   Stack: ${fallbackError.stack}`);
      console.log(`\n${'💀'.repeat(40)}\n`);

      logger.error('[EMAIL RETRY] Fallback também falhou!', {
        to: mailOptions.to,
        error: fallbackError.message,
      });
      throw lastError; // Lançar erro original
    }
  }

  /**
   * Criar transporter Ethereal para fallback
   */
  async createEtherealFallback() {
    // Timeout de 10s para criar conta Ethereal
    const testAccount = await Promise.race([
      nodemailer.createTestAccount(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao criar conta Ethereal (10s)')), 10000)
      ),
    ]);

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  /**
   * Enviar email via SendGrid API (HTTP)
   */
  async sendViaSendGridAPI(to, subject, html, fromAddress, fromName) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromAddress, name: fromName },
        subject: subject,
        content: [{ type: 'text/html', value: html }],
      });

      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.sendgridApiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const messageId = res.headers['x-message-id'] || `sendgrid-${Date.now()}`;
            logger.info('✅ Email enviado via SendGrid API', {
              to,
              statusCode: res.statusCode,
              messageId,
            });
            resolve({ messageId, accepted: [to] });
          } else {
            logger.error('❌ SendGrid API retornou erro', {
              statusCode: res.statusCode,
              body,
            });
            reject(new Error(`SendGrid API error: ${res.statusCode} - ${body}`));
          }
        });
      });

      req.on('error', (error) => {
        logger.error('❌ Erro na requisição SendGrid API', { error: error.message });
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('SendGrid API timeout (10s)'));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Enviar email de verificação com código de 6 dígitos
   */
  async sendVerificationEmail(email, name, code) {
    logger.info('[EMAIL SERVICE] Iniciando envio de email...', {
      email,
      initialized: this.initialized,
    });
    await this.initialize();
    logger.info('[EMAIL SERVICE] Inicialização completa, enviando email...');

    try {
      const fromAddress =
        process.env.MAIL_FROM || process.env.EMAIL_FROM || 'noreply@plataformaongs.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'Plataforma ONGs';
      const subject = 'Verificação de Email - Código de Confirmação';
      const html = this.getVerificationEmailTemplate(name, code);

      let info;

      // Usar SendGrid API se disponível
      if (this.useSendGridAPI) {
        logger.info('📤 Enviando via SendGrid API (HTTP)...');
        info = await this.sendViaSendGridAPI(email, subject, html, fromAddress, fromName);
      } else {
        // Fallback para SMTP
        logger.info('📤 Enviando via SMTP...');
        const mailOptions = {
          from: `"${fromName}" <${fromAddress}>`,
          to: email,
          subject,
          html,
        };
        info = await this.transporter.sendMail(mailOptions);
      }

      const previewUrl = nodemailer.getTestMessageUrl(info) || false;

      logger.info('Email de verificação enviado', {
        email,
        messageId: info.messageId,
        method: this.useSendGridAPI ? 'API' : 'SMTP',
        previewUrl,
      });

      if (previewUrl) {
        logger.info(`📧 Preview do email: ${previewUrl}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        data: { previewUrl },
      };
    } catch (error) {
      logger.error('Erro ao enviar email de verificação', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Enviar email de recuperação de senha com código de 6 dígitos
   */
  async sendPasswordResetEmail(email, name, code) {
    await this.initialize();

    try {
      const fromAddress =
        process.env.MAIL_FROM || process.env.EMAIL_FROM || 'noreply@plataformaongs.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'Plataforma ONGs';
      const subject = 'Recuperação de Senha - Código de Verificação';
      const html = this.getPasswordResetEmailTemplate(name, code);

      let info;

      // Usar SendGrid API se disponível
      if (this.useSendGridAPI) {
        logger.info('📤 Enviando via SendGrid API (HTTP)...');
        info = await this.sendViaSendGridAPI(email, subject, html, fromAddress, fromName);
      } else {
        // Fallback para SMTP
        logger.info('📤 Enviando via SMTP...');
        const mailOptions = {
          from: `"${fromName}" <${fromAddress}>`,
          to: email,
          subject,
          html,
        };
        info = await this.transporter.sendMail(mailOptions);
      }

      const previewUrl = nodemailer.getTestMessageUrl(info) || false;

      logger.info('Email de recuperação de senha enviado', {
        email,
        messageId: info.messageId,
        method: this.useSendGridAPI ? 'API' : 'SMTP',
        previewUrl,
      });

      if (previewUrl) {
        console.log('\n' + '='.repeat(80));
        console.log('🔑 EMAIL DE RECUPERAÇÃO DE SENHA ENVIADO');
        console.log('='.repeat(80));
        console.log(`Para: ${email}`);
        console.log(`Código: ${code}`);
        console.log(`\n🔗 Visualizar email:`);
        console.log(`   ${previewUrl}`);
        console.log('='.repeat(80) + '\n');
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
      };
    } catch (error) {
      logger.error('Erro ao enviar email de recuperação de senha', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Template HTML para email de verificação
   */
  getVerificationEmailTemplate(name, code) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 30px;
            color: white;
          }
          .code-box {
            background: white;
            color: #333;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #667eea;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Bem-vindo, ${name}!</h1>
          <p>Obrigado por se cadastrar na nossa plataforma. Para completar seu cadastro, por favor verifique seu email usando o código abaixo:</p>
          
          <div class="code-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Seu código de verificação:</p>
            <div class="code">${code}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Este código expira em 15 minutos</p>
          </div>
          
          <p>Se você não criou uma conta, por favor ignore este email.</p>
          
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template HTML para email de recuperação de senha
   */
  getPasswordResetEmailTemplate(name, code) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 10px;
            padding: 30px;
            color: white;
          }
          .code-box {
            background: white;
            color: #333;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #f5576c;
          }
          .warning {
            background: rgba(255, 255, 255, 0.2);
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Recuperação de Senha</h1>
          <p>Olá, ${name}!</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Use o código abaixo para criar uma nova senha:</p>
          
          <div class="code-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Seu código de recuperação:</p>
            <div class="code">${code}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Este código expira em 15 minutos</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <p style="margin: 5px 0 0 0;">Se você não solicitou a recuperação de senha, ignore este email. Sua senha permanecerá inalterada.</p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Singleton
let instance = null;

function getEmailService() {
  if (!instance) {
    instance = new EmailService();
  }
  return instance;
}

module.exports = { EmailService, getEmailService };
