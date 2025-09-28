/**
 * Middleware para prevenir processamento duplicado de requisições
 * Implementa cache temporário para detectar requisições repetidas
 */
class RequestDeduplicationMiddleware {
  constructor() {
    this.requestCache = new Map();
    this.cleanupInterval = 30000; // 30 segundos
    this.requestTimeout = 10000; // 10 segundos
    
    // Limpeza automática do cache
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Gera chave única para a requisição
   * @param {Request} req - Objeto de requisição Express
   * @returns {string} Chave única
   */
  generateRequestKey(req) {
    const { method, originalUrl, ip } = req;
    const body = method === 'POST' || method === 'PUT' ? JSON.stringify(req.body) : '';
    const userAgent = req.get('User-Agent') || '';
    
    return `${method}:${originalUrl}:${ip}:${userAgent}:${body}`;
  }

  /**
   * CHAIN OF RESPONSIBILITY PATTERN: Middleware de deduplicação
   * Atua como handler na cadeia de processamento de requisições
   * Se não há duplicação, passa para o próximo handler via next()
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @param {Function} next - Função next do Express
   */
  middleware = (req, res, next) => {
    // Pular deduplicação para rotas específicas
    const skipRoutes = ['/health'];
    if (skipRoutes.some(route => req.originalUrl.includes(route))) {
      return next();
    }

    // Configurações especiais para diferentes endpoints
    let timeoutForThisRequest = this.requestTimeout;
    
    // Refresh token: timeout menor para evitar loops
    if (req.originalUrl.includes('/api/auth/refresh')) {
      timeoutForThisRequest = 2000; // 2 segundos apenas
    }
    
    // Logout: timeout muito pequeno
    if (req.originalUrl.includes('/api/auth/logout')) {
      timeoutForThisRequest = 1000; // 1 segundo apenas
    }

    const requestKey = this.generateRequestKey(req);
    const now = Date.now();
    
    // Verificar se a requisição já está sendo processada
    if (this.requestCache.has(requestKey)) {
      const cachedRequest = this.requestCache.get(requestKey);
      
      // Se ainda está dentro do timeout, bloquear
      if (now - cachedRequest.timestamp < timeoutForThisRequest) {
        console.log(`[DEDUP] Requisição duplicada bloqueada: ${req.method} ${req.originalUrl}`);
        return res.status(429).json({
          success: false,
          message: 'Duplicate request detected. Please wait before trying again.',
          retryAfter: Math.ceil((timeoutForThisRequest - (now - cachedRequest.timestamp)) / 1000)
        });
      }
    }

    // Adicionar ao cache
    this.requestCache.set(requestKey, {
      timestamp: now,
      method: req.method,
      url: req.originalUrl
    });

    console.log(`[DEDUP] Requisição processada: ${req.method} ${req.originalUrl}`);

    // Remover do cache quando a resposta for enviada
    const originalSend = res.send.bind(res);
    const middleware = this;
    
    res.send = function(data) {
      middleware.requestCache.delete(requestKey);
      return originalSend(data);
    };

    next(); // CHAIN OF RESPONSIBILITY: Passa para o próximo handler na cadeia
  };

  /**
   * Limpa entradas expiradas do cache
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, request] of this.requestCache.entries()) {
      if (now - request.timestamp > this.requestTimeout) {
        this.requestCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[DEDUP] Cache limpo: ${cleaned} entradas removidas`);
    }
  }

  /**
   * Retorna estatísticas do cache
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalCached: this.requestCache.size,
      requests: Array.from(this.requestCache.values()).map(req => ({
        method: req.method,
        url: req.url,
        age: Date.now() - req.timestamp
      }))
    };
  }

  /**
   * Limpa todo o cache manualmente
   */
  clearCache() {
    const size = this.requestCache.size;
    this.requestCache.clear();
    console.log(`[DEDUP] Cache limpo manualmente: ${size} entradas removidas`);
  }
}

// Singleton instance
const deduplicationMiddleware = new RequestDeduplicationMiddleware();

module.exports = {
  RequestDeduplicationMiddleware,
  deduplicationMiddleware: deduplicationMiddleware.middleware,
  getDeduplicationStats: () => deduplicationMiddleware.getStats(),
  clearDeduplicationCache: () => deduplicationMiddleware.clearCache()
};
