const nodemailer = require('nodemailer');
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
      // Verificar se há configurações de SMTP no .env
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Usar SMTP configurado
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        logger.info('EmailService inicializado com SMTP configurado');
      } else {
        // FALLBACK: Em produção sem SMTP, usar modo mock (não envia email real)
        if (process.env.NODE_ENV === 'production') {
          logger.warn('⚠️ SMTP não configurado em produção! Emails NÃO serão enviados!');
          logger.warn('Configure SMTP_HOST, SMTP_USER, SMTP_PASS no .env');

          // Criar transporter mock que não envia nada
          this.transporter = {
            sendMail: async (mailOptions) => {
              logger.info('📧 [MOCK] Email que seria enviado:', {
                to: mailOptions.to,
                subject: mailOptions.subject,
              });
              return {
                messageId: 'mock-' + Date.now(),
                accepted: [mailOptions.to],
              };
            },
          };

          this.initialized = true;
          return;
        }

        // Desenvolvimento: tentar Ethereal com timeout
        logger.info('Tentando criar conta Ethereal (timeout: 5s)...');

        const testAccount = await Promise.race([
          nodemailer.createTestAccount(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout ao criar conta Ethereal')), 5000)
          ),
        ]);

        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        logger.info('EmailService inicializado com Ethereal Email (teste)', {
          user: testAccount.user,
        });
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Erro ao inicializar EmailService', { error: error.message });

      // FALLBACK FINAL: criar transporter mock
      logger.warn('Usando modo MOCK - emails não serão enviados!');
      this.transporter = {
        sendMail: async (mailOptions) => {
          logger.info('📧 [MOCK FALLBACK] Email que seria enviado:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
          });
          return {
            messageId: 'mock-fallback-' + Date.now(),
            accepted: [mailOptions.to],
          };
        },
      };
      this.initialized = true;
    }
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
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Plataforma ONGs'}" <${process.env.EMAIL_FROM || 'noreply@plataformaongs.com'}>`,
        to: email,
        subject: 'Verificação de Email - Código de Confirmação',
        html: this.getVerificationEmailTemplate(name, code),
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      logger.info('Email de verificação enviado', {
        email,
        messageId: info.messageId,
        previewUrl,
      });

      // Log adicional para facilitar visualização
      if (previewUrl) {
        console.log('\n' + '='.repeat(80));
        console.log('📧 EMAIL DE VERIFICAÇÃO ENVIADO');
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
        previewUrl, // URL para visualizar no Ethereal
      };
    } catch (error) {
      logger.error('Erro ao enviar email de verificação', {
        email,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Enviar email de recuperação de senha com código de 6 dígitos
   */
  async sendPasswordResetEmail(email, name, code) {
    await this.initialize();

    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Plataforma ONGs'}" <${process.env.EMAIL_FROM || 'noreply@plataformaongs.com'}>`,
        to: email,
        subject: 'Recuperação de Senha - Código de Verificação',
        html: this.getPasswordResetEmailTemplate(name, code),
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      logger.info('Email de recuperação de senha enviado', {
        email,
        messageId: info.messageId,
        previewUrl,
      });

      // Log adicional para facilitar visualização
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
      logger.error('Erro ao enviar email de recuperação de senha', {
        email,
        error: error.message,
      });
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
