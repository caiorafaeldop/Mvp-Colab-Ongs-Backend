const { BaseMiddleware } = require('./BaseMiddleware');
const { logger } = require('../../infra/logger');

/**
 * CHAIN OF RESPONSIBILITY - Handler específico para fluxo de doações
 * Implementa cadeia coesa para processar doações com múltiplas validações
 */

/**
 * Handler para validação de dados de doação
 */
class DonationValidationHandler extends BaseMiddleware {
  constructor() {
    super('DonationValidation');
  }
  
  async handle(req, res, next) {
    const requestLogger = req.logger || logger;
    
    // Verificar se dados já foram validados pelo middleware anterior
    if (req.validatedBody) {
      requestLogger.debug('Dados já validados por middleware anterior', {
        middleware: this.name
      });
      return next();
    }
    
    // Validações específicas de doação
    const { organizationId, organizationName, amount, donorEmail, donorName } = req.body;
    
    const errors = [];
    
    if (!organizationId) errors.push('organizationId é obrigatório');
    if (!organizationName) errors.push('organizationName é obrigatório');
    if (!amount || amount <= 0) errors.push('amount deve ser maior que zero');
    if (!donorEmail) errors.push('donorEmail é obrigatório');
    if (!donorName) errors.push('donorName é obrigatório');
    
    // Validar formato do email
    if (donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      errors.push('donorEmail deve ter formato válido');
    }
    
    if (errors.length > 0) {
      requestLogger.warn('Validação de doação falhou', {
        middleware: this.name,
        errors,
        organizationId,
        amount
      });
      
      this.sendError(res, 400, 'Dados de doação inválidos', 'DONATION_VALIDATION_ERROR', { errors });
      return;
    }
    
    // Adicionar dados validados ao contexto
    req.donationData = {
      organizationId,
      organizationName,
      amount: parseFloat(amount),
      donorEmail,
      donorName,
      donorPhone: req.body.donorPhone,
      donorDocument: req.body.donorDocument,
      message: req.body.message,
      frequency: req.body.frequency,
      isAnonymous: req.body.isAnonymous || false
    };
    
    requestLogger.debug('Dados de doação validados', {
      middleware: this.name,
      organizationId,
      amount: req.donationData.amount,
      type: req.body.frequency ? 'recurring' : 'single'
    });
    
    next();
  }
}

/**
 * Handler para verificação de limites e políticas
 */
class DonationPolicyHandler extends BaseMiddleware {
  constructor() {
    super('DonationPolicy');
  }
  
  async handle(req, res, next) {
    const requestLogger = req.logger || logger;
    const { amount, donorEmail } = req.donationData;
    
    // Verificar limite mínimo
    const minAmount = process.env.MIN_DONATION_AMOUNT || 1;
    if (amount < minAmount) {
      requestLogger.warn('Valor abaixo do mínimo permitido', {
        middleware: this.name,
        amount,
        minAmount,
        donorEmail
      });
      
      this.sendError(res, 400, `Valor mínimo para doação é R$ ${minAmount}`, 'AMOUNT_TOO_LOW');
      return;
    }
    
    // Verificar limite máximo
    const maxAmount = process.env.MAX_DONATION_AMOUNT || 10000;
    if (amount > maxAmount) {
      requestLogger.warn('Valor acima do máximo permitido', {
        middleware: this.name,
        amount,
        maxAmount,
        donorEmail
      });
      
      this.sendError(res, 400, `Valor máximo para doação é R$ ${maxAmount}`, 'AMOUNT_TOO_HIGH');
      return;
    }
    
    // Verificar se é doação recorrente com valor muito baixo
    if (req.body.frequency && amount < 5) {
      requestLogger.warn('Valor muito baixo para doação recorrente', {
        middleware: this.name,
        amount,
        frequency: req.body.frequency,
        donorEmail
      });
      
      this.sendError(res, 400, 'Valor mínimo para doação recorrente é R$ 5,00', 'RECURRING_AMOUNT_TOO_LOW');
      return;
    }
    
    requestLogger.debug('Políticas de doação verificadas', {
      middleware: this.name,
      amount,
      withinLimits: true
    });
    
    next();
  }
}

/**
 * Handler para verificação de rate limiting específico para doações
 */
class DonationRateLimitHandler extends BaseMiddleware {
  constructor() {
    super('DonationRateLimit');
    this.donationAttempts = new Map(); // Em produção, usar Redis
  }
  
  async handle(req, res, next) {
    const requestLogger = req.logger || logger;
    const { donorEmail } = req.donationData;
    const clientIp = req.ip;
    const key = `${donorEmail}:${clientIp}`;
    
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutos
    const maxAttempts = 3; // máximo 3 doações por 5 minutos
    
    // Limpar tentativas antigas
    const attempts = this.donationAttempts.get(key) || [];
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      requestLogger.warn('Rate limit excedido para doações', {
        middleware: this.name,
        donorEmail,
        clientIp,
        attempts: recentAttempts.length,
        maxAttempts
      });
      
      this.sendError(res, 429, 'Muitas tentativas de doação. Tente novamente em alguns minutos.', 'DONATION_RATE_LIMIT');
      return;
    }
    
    // Registrar tentativa atual
    recentAttempts.push(now);
    this.donationAttempts.set(key, recentAttempts);
    
    requestLogger.debug('Rate limit verificado para doação', {
      middleware: this.name,
      donorEmail,
      attempts: recentAttempts.length,
      maxAttempts
    });
    
    next();
  }
}

/**
 * Handler para enriquecimento de contexto da doação
 */
class DonationContextHandler extends BaseMiddleware {
  constructor() {
    super('DonationContext');
  }
  
  async handle(req, res, next) {
    const requestLogger = req.logger || logger;
    
    // Adicionar metadados da doação
    req.donationContext = {
      ...req.donationData,
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date(),
        requestId: req.requestId,
        source: 'web_api',
        version: '1.0'
      }
    };
    
    // Determinar tipo de doação
    req.donationContext.type = req.body.frequency ? 'recurring' : 'single';
    
    requestLogger.info('Contexto de doação enriquecido', {
      middleware: this.name,
      organizationId: req.donationContext.organizationId,
      amount: req.donationContext.amount,
      type: req.donationContext.type,
      donorEmail: req.donationContext.donorEmail
    });
    
    next();
  }
}

/**
 * Factory para criar cadeia de handlers de doação
 */
class DonationChainFactory {
  static createDonationChain() {
    return [
      new DonationValidationHandler().toExpressMiddleware(),
      new DonationPolicyHandler().toExpressMiddleware(),
      new DonationRateLimitHandler().toExpressMiddleware(),
      new DonationContextHandler().toExpressMiddleware()
    ];
  }
  
  /**
   * Cria cadeia específica para doações recorrentes
   */
  static createRecurringDonationChain() {
    const chain = this.createDonationChain();
    
    // Adicionar validação específica para recorrentes
    const recurringValidator = (req, res, next) => {
      const requestLogger = req.logger || logger;
      
      if (!req.body.frequency) {
        requestLogger.warn('Frequência não especificada para doação recorrente', {
          middleware: 'RecurringValidator'
        });
        
        return res.status(400).json({
          success: false,
          message: 'Frequência é obrigatória para doações recorrentes',
          error: 'MISSING_FREQUENCY',
          requestId: req.requestId
        });
      }
      
      const validFrequencies = ['monthly', 'weekly', 'yearly'];
      if (!validFrequencies.includes(req.body.frequency)) {
        requestLogger.warn('Frequência inválida para doação recorrente', {
          middleware: 'RecurringValidator',
          frequency: req.body.frequency,
          validFrequencies
        });
        
        return res.status(400).json({
          success: false,
          message: 'Frequência deve ser: monthly, weekly ou yearly',
          error: 'INVALID_FREQUENCY',
          requestId: req.requestId
        });
      }
      
      next();
    };
    
    // Inserir validador específico antes do contexto
    chain.splice(-1, 0, recurringValidator);
    
    return chain;
  }
}

module.exports = {
  DonationValidationHandler,
  DonationPolicyHandler,
  DonationRateLimitHandler,
  DonationContextHandler,
  DonationChainFactory
};
