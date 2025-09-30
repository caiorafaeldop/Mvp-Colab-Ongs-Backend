const { logger } = require('../../infra/logger');

/**
 * CHAIN OF RESPONSIBILITY - Rate Limiting Middleware
 * Implementa controle de taxa de requisições por IP/usuário
 */

/**
 * Rate limiter em memória (em produção usar Redis)
 */
class InMemoryRateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Limpeza a cada minuto
  }
  
  /**
   * Verifica se request pode prosseguir
   * @param {string} key - Chave única (IP, userId, etc.)
   * @param {number} windowMs - Janela de tempo em ms
   * @param {number} maxRequests - Máximo de requests na janela
   * @returns {Object} Resultado da verificação
   */
  checkLimit(key, windowMs, maxRequests) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Obter requests existentes
    let requests = this.requests.get(key) || [];
    
    // Filtrar apenas requests dentro da janela
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Verificar se excedeu limite
    if (requests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...requests) + windowMs,
        retryAfter: Math.ceil((Math.min(...requests) + windowMs - now) / 1000)
      };
    }
    
    // Adicionar request atual
    requests.push(now);
    this.requests.set(key, requests);
    
    return {
      allowed: true,
      remaining: maxRequests - requests.length,
      resetTime: now + windowMs,
      retryAfter: 0
    };
  }
  
  /**
   * Limpa dados antigos
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => now - timestamp < maxAge);
      
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
  
  /**
   * Limpa rate limiter
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

// Instância global do rate limiter
const globalRateLimiter = new InMemoryRateLimiter();

/**
 * Cria middleware de rate limiting
 * @param {Object} options - Opções de configuração
 * @returns {Function} Middleware do Express
 */
function createRateLimitMiddleware(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    maxRequests = 100, // 100 requests por janela
    keyGenerator = (req) => req.ip, // Função para gerar chave única
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests, please try again later.',
    standardHeaders = true, // Incluir headers padrão
    legacyHeaders = false, // Headers antigos do express-rate-limit
    onLimitReached = null // Callback quando limite é atingido
  } = options;
  
  return (req, res, next) => {
    const requestLogger = req.logger || logger;
    const key = keyGenerator(req);
    
    // Verificar limite
    const result = globalRateLimiter.checkLimit(key, windowMs, maxRequests);
    
    // Adicionar headers informativos
    if (standardHeaders) {
      res.setHeader('RateLimit-Limit', maxRequests);
      res.setHeader('RateLimit-Remaining', result.remaining);
      res.setHeader('RateLimit-Reset', new Date(result.resetTime).toISOString());
    }
    
    if (legacyHeaders) {
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
    }
    
    if (!result.allowed) {
      // Adicionar header Retry-After
      res.setHeader('Retry-After', result.retryAfter);
      
      // Log do rate limit atingido
      requestLogger.warn('Rate limit excedido', {
        middleware: 'RateLimit',
        key,
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        retryAfter: result.retryAfter,
        userId: req.user?.id || req.user?._id
      });
      
      // Callback personalizado
      if (onLimitReached) {
        try {
          onLimitReached(req, res);
        } catch (error) {
          requestLogger.error('Erro no callback onLimitReached', {
            middleware: 'RateLimit',
            error: error.message
          });
        }
      }
      
      return res.status(429).json({
        success: false,
        message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: result.retryAfter,
        requestId: req.requestId
      });
    }
    
    // Log de request permitido (apenas em debug)
    requestLogger.debug('Rate limit verificado', {
      middleware: 'RateLimit',
      key,
      remaining: result.remaining,
      maxRequests
    });
    
    next();
  };
}

/**
 * Presets de rate limiting para diferentes cenários
 */
const RateLimitPresets = {
  // Rate limit geral para API
  general: () => createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  }),
  
  // Rate limit rigoroso para autenticação
  auth: () => createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // Apenas 5 tentativas de login
    keyGenerator: (req) => `auth:${req.ip}:${req.body?.email || 'unknown'}`,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  }),
  
  // Rate limit para uploads
  upload: () => createRateLimitMiddleware({
    windowMs: 10 * 60 * 1000, // 10 minutos
    maxRequests: 20,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: 'Muitos uploads. Tente novamente em alguns minutos.'
  }),
  
  // Rate limit para webhooks
  webhook: () => createRateLimitMiddleware({
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 100,
    keyGenerator: (req) => `webhook:${req.ip}`,
    message: 'Webhook rate limit exceeded'
  }),
  
  // Rate limit por usuário autenticado
  perUser: (maxRequests = 1000) => createRateLimitMiddleware({
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: 'Limite de requisições por usuário excedido.'
  })
};

/**
 * Middleware que combina rate limiting por IP e por usuário
 */
function createCombinedRateLimit(ipOptions = {}, userOptions = {}) {
  const ipRateLimit = createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    maxRequests: 200,
    keyGenerator: (req) => req.ip,
    ...ipOptions
  });
  
  const userRateLimit = createRateLimitMiddleware({
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
    keyGenerator: (req) => req.user?.id || req.ip,
    ...userOptions
  });
  
  return [ipRateLimit, userRateLimit];
}

module.exports = {
  createRateLimitMiddleware,
  RateLimitPresets,
  createCombinedRateLimit,
  InMemoryRateLimiter,
  globalRateLimiter
};
