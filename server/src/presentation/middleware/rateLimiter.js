const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { logger } = require('../../infra/logger');

/**
 * Configurações de Rate Limiting para diferentes endpoints
 * Protege a aplicação contra abuso e ataques
 */

// Rate limiter geral para toda a API
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // Máximo 100 requests por minuto por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 1 minuto.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true, // Retorna rate limit info nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  
  // Função customizada para pular rate limiting em certas condições
  skip: (req) => {
    // Pular para health checks
    if (req.path === '/health' || req.path === '/api/health') {
      return true;
    }
    
    // Pular para IPs whitelistados (se configurado)
    const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return whitelistedIPs.includes(req.ip);
  },
  
  // Handler customizado para quando limite é excedido
  handler: (req, res) => {
    logger.warn('Rate limit excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      rateLimiter: 'general'
    });
    
    res.status(429).json({
      success: false,
      message: 'Muitas requisições. Tente novamente em 1 minuto.',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

// Rate limiter específico para autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas de login por IP em 15 minutos
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // Aplicar apenas para endpoints de autenticação
  skipSuccessfulRequests: true, // Não contar requests bem-sucedidos
  
  handler: (req, res) => {
    logger.warn('Rate limit de autenticação excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      rateLimiter: 'auth'
    });
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      error: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

// Rate limiter para criação de doações (moderadamente restritivo)
const donationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // Máximo 10 doações por IP em 5 minutos
  message: {
    success: false,
    message: 'Muitas tentativas de doação. Tente novamente em 5 minutos.',
    error: 'DONATION_RATE_LIMIT_EXCEEDED',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.warn('Rate limit de doação excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      rateLimiter: 'donation',
      userId: req.user?.id
    });
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de doação. Tente novamente em 5 minutos.',
      error: 'DONATION_RATE_LIMIT_EXCEEDED',
      retryAfter: 300
    });
  }
});

// Rate limiter para webhooks (mais permissivo)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 1000, // Máximo 1000 webhooks por minuto
  message: {
    success: false,
    message: 'Webhook rate limit exceeded',
    error: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.warn('Rate limit de webhook excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      rateLimiter: 'webhook'
    });
    
    res.status(429).json({
      success: false,
      message: 'Webhook rate limit exceeded',
      error: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Slow down middleware para degradar performance gradualmente
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minuto
  delayAfter: 50, // Permitir 50 requests por minuto sem delay
  delayMs: () => 500, // Função que retorna delay fixo (nova sintaxe)
  maxDelayMs: 5000, // Máximo de 5 segundos de delay
  validate: { delayMs: false }, // Desabilita warning sobre delayMs
  
  // Usar skip ao invés de onLimitReached (deprecated)
  skip: (req, res) => {
    // Log quando limite é atingido
    if (req.slowDown && req.slowDown.used > req.slowDown.limit) {
      logger.warn('Speed limit atingido', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        used: req.slowDown.used,
        limit: req.slowDown.limit
      });
    }
    return false; // Não pular, aplicar o delay
  }
});

// Rate limiter baseado em usuário autenticado (mais permissivo)
const createUserBasedLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      // Usar ID do usuário se autenticado, senão IP
      return req.user?.id || req.ip;
    },
    message: {
      success: false,
      message: 'Limite de requisições por usuário excedido',
      error: 'USER_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    handler: (req, res) => {
      logger.warn('Rate limit por usuário excedido', {
        ip: req.ip,
        userId: req.user?.id,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        rateLimiter: 'user-based'
      });
      
      res.status(429).json({
        success: false,
        message: 'Limite de requisições por usuário excedido',
        error: 'USER_RATE_LIMIT_EXCEEDED'
      });
    }
  });
};

// Factory para criar limiters customizados
const createCustomLimiter = (options) => {
  const defaultOptions = {
    windowMs: 1 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit customizado excedido', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        rateLimiter: 'custom'
      });
      
      res.status(429).json({
        success: false,
        message: 'Rate limit excedido',
        error: 'CUSTOM_RATE_LIMIT_EXCEEDED'
      });
    }
  };
  
  return rateLimit({ ...defaultOptions, ...options });
};

module.exports = {
  generalLimiter,
  authLimiter,
  donationLimiter,
  webhookLimiter,
  speedLimiter,
  createUserBasedLimiter,
  createCustomLimiter
};
