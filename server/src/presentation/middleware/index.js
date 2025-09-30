/**
 * CHAIN OF RESPONSIBILITY - Índice central de middlewares
 * Exporta todos os middlewares da cadeia de responsabilidade
 */

// Middlewares de correlação e contexto
const { 
  requestCorrelationMiddleware, 
  requestContextMiddleware 
} = require('./RequestCorrelationMiddleware');

// Middlewares base e factory
const { BaseMiddleware, MiddlewareFactory } = require('./BaseMiddleware');

// Middlewares de validação
const {
  validateDTO,
  safeValidateDTO,
  validateParams,
  validateQuery,
  validateBody,
  validateMultiple
} = require('./validationMiddleware');

// Middleware de autenticação
const { createSimpleAuthMiddleware, authMiddleware } = require('./SimpleAuthMiddleware');

// Middlewares de rate limiting
const {
  createRateLimitMiddleware,
  RateLimitPresets,
  createCombinedRateLimit
} = require('./RateLimitMiddleware');

// Handlers específicos para doações
const {
  DonationValidationHandler,
  DonationPolicyHandler,
  DonationRateLimitHandler,
  DonationContextHandler,
  DonationChainFactory
} = require('./DonationChainHandler');

// Error handlers
const {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  categorizeError
} = require('./ErrorHandler');

/**
 * Configuração padrão da cadeia de middlewares para aplicação
 * @param {Object} options - Opções de configuração
 * @returns {Array} Array de middlewares na ordem correta
 */
function createDefaultMiddlewareChain(options = {}) {
  const {
    enableCorrelation = true,
    enableRateLimit = true,
    rateLimitPreset = 'general',
    enableAuth = false,
    authService = null
  } = options;
  
  const chain = [];
  
  // 1. Correlação de requests (sempre primeiro)
  if (enableCorrelation) {
    chain.push(requestCorrelationMiddleware);
    chain.push(requestContextMiddleware);
  }
  
  // 2. Rate limiting geral
  if (enableRateLimit) {
    const rateLimiter = RateLimitPresets[rateLimitPreset] || RateLimitPresets.general;
    chain.push(rateLimiter());
  }
  
  // 3. Autenticação (se habilitada)
  if (enableAuth && authService) {
    chain.push(createSimpleAuthMiddleware(authService));
  }
  
  return chain;
}

/**
 * Configuração específica para rotas de API
 */
function createAPIMiddlewareChain(authService) {
  return [
    requestCorrelationMiddleware,
    requestContextMiddleware,
    RateLimitPresets.general(),
    // Auth será adicionado por rota conforme necessário
  ];
}

/**
 * Configuração para rotas de autenticação
 */
function createAuthMiddlewareChain() {
  return [
    requestCorrelationMiddleware,
    requestContextMiddleware,
    RateLimitPresets.auth()
  ];
}

/**
 * Configuração para rotas de upload
 */
function createUploadMiddlewareChain(authService) {
  return [
    requestCorrelationMiddleware,
    requestContextMiddleware,
    RateLimitPresets.upload(),
    createSimpleAuthMiddleware(authService)
  ];
}

/**
 * Configuração para webhooks
 */
function createWebhookMiddlewareChain() {
  return [
    requestCorrelationMiddleware,
    RateLimitPresets.webhook()
    // Não incluir contexto completo para webhooks (performance)
  ];
}

module.exports = {
  // Middlewares individuais
  requestCorrelationMiddleware,
  requestContextMiddleware,
  BaseMiddleware,
  MiddlewareFactory,
  validateDTO,
  safeValidateDTO,
  validateParams,
  validateQuery,
  validateBody,
  validateMultiple,
  createSimpleAuthMiddleware,
  authMiddleware,
  createRateLimitMiddleware,
  RateLimitPresets,
  createCombinedRateLimit,
  
  // Handlers específicos
  DonationValidationHandler,
  DonationPolicyHandler,
  DonationRateLimitHandler,
  DonationContextHandler,
  DonationChainFactory,
  
  // Error handlers
  errorHandler,
  notFoundHandler,
  asyncHandler,
  categorizeError,
  
  // Configurações de cadeia
  createDefaultMiddlewareChain,
  createAPIMiddlewareChain,
  createAuthMiddlewareChain,
  createUploadMiddlewareChain,
  createWebhookMiddlewareChain
};
