const IObserver = require('../../domain/observers/IObserver');

/**
 * Observer para eventos do sistema
 * Monitora eventos técnicos, logs e métricas do sistema
 */
class SystemEventObserver extends IObserver {
  constructor() {
    super();
    this.name = 'SystemEventObserver';
    this.errorCounts = new Map();
    this.performanceMetrics = [];
    this.maxMetricsHistory = 1000;
  }

  /**
   * Processa eventos do sistema
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async update(event, context = {}) {
    try {
      switch (event.type) {
        case 'system.error':
          await this.handleSystemError(event.data, context);
          break;
        case 'system.performance':
          await this.handlePerformanceMetric(event.data, context);
          break;
        case 'system.startup':
          await this.handleSystemStartup(event.data, context);
          break;
        case 'system.shutdown':
          await this.handleSystemShutdown(event.data, context);
          break;
        case 'database.connection':
          await this.handleDatabaseConnection(event.data, context);
          break;
        case 'api.request':
          await this.handleApiRequest(event.data, context);
          break;
        case 'file.upload':
          await this.handleFileUpload(event.data, context);
          break;
        case 'auth.attempt':
          await this.handleAuthAttempt(event.data, context);
          break;
        default:
          console.log(`[SystemEventObserver] Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error(`[SystemEventObserver] Erro ao processar evento ${event.type}:`, error.message);
    }
  }

  /**
   * Trata erros do sistema
   * @param {Object} data - Dados do erro
   * @param {Object} context - Contexto
   */
  async handleSystemError(data, context) {
    const { error, component, severity, userId } = data;

    console.error(`[SystemEventObserver] Erro ${severity}: ${error.message} em ${component}`);

    // Conta erros por componente
    const errorKey = `${component}:${error.name}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

    // Log detalhado para erros críticos
    if (severity === 'critical') {
      console.error(`[SystemEventObserver] ERRO CRÍTICO:`, {
        component,
        error: error.message,
        stack: error.stack,
        userId,
        timestamp: new Date(),
        context
      });
    }

    // Alerta se muitos erros do mesmo tipo
    if (this.errorCounts.get(errorKey) >= 5) {
      console.warn(`[SystemEventObserver] ALERTA: ${errorKey} ocorreu ${this.errorCounts.get(errorKey)} vezes`);
    }
  }

  /**
   * Trata métricas de performance
   * @param {Object} data - Dados da métrica
   * @param {Object} context - Contexto
   */
  async handlePerformanceMetric(data, context) {
    const { operation, duration, success, metadata } = data;

    // Armazena métrica
    const metric = {
      operation,
      duration,
      success,
      metadata,
      timestamp: new Date()
    };

    this.performanceMetrics.push(metric);

    // Mantém histórico limitado
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsHistory);
    }

    // Log para operações lentas
    if (duration > 5000) { // 5 segundos
      console.warn(`[SystemEventObserver] Operação lenta: ${operation} levou ${duration}ms`);
    }

    // Log para falhas
    if (!success) {
      console.error(`[SystemEventObserver] Operação falhou: ${operation}`);
    }
  }

  /**
   * Trata inicialização do sistema
   * @param {Object} data - Dados da inicialização
   * @param {Object} context - Contexto
   */
  async handleSystemStartup(data, context) {
    const { version, environment, startTime } = data;

    console.log(`[SystemEventObserver] Sistema iniciado - Versão: ${version}, Ambiente: ${environment}`);
    
    // Reset contadores
    this.errorCounts.clear();
    this.performanceMetrics = [];

    console.log(`[SystemEventObserver] Métricas resetadas no startup`);
  }

  /**
   * Trata desligamento do sistema
   * @param {Object} data - Dados do desligamento
   * @param {Object} context - Contexto
   */
  async handleSystemShutdown(data, context) {
    const { reason, uptime } = data;

    console.log(`[SystemEventObserver] Sistema desligando - Motivo: ${reason}, Uptime: ${uptime}`);
    
    // Log de estatísticas finais
    console.log(`[SystemEventObserver] Estatísticas finais:`, {
      totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
      totalMetrics: this.performanceMetrics.length,
      errorsByComponent: Object.fromEntries(this.errorCounts)
    });
  }

  /**
   * Trata eventos de conexão com banco
   * @param {Object} data - Dados da conexão
   * @param {Object} context - Contexto
   */
  async handleDatabaseConnection(data, context) {
    const { status, database, responseTime } = data;

    if (status === 'connected') {
      console.log(`[SystemEventObserver] Banco conectado: ${database} (${responseTime}ms)`);
    } else if (status === 'disconnected') {
      console.warn(`[SystemEventObserver] Banco desconectado: ${database}`);
    } else if (status === 'error') {
      console.error(`[SystemEventObserver] Erro de conexão com banco: ${database}`);
    }
  }

  /**
   * Trata requisições da API
   * @param {Object} data - Dados da requisição
   * @param {Object} context - Contexto
   */
  async handleApiRequest(data, context) {
    const { method, path, statusCode, duration, userId, ip } = data;

    // Log para requisições lentas
    if (duration > 2000) {
      console.warn(`[SystemEventObserver] API lenta: ${method} ${path} - ${duration}ms`);
    }

    // Log para erros de API
    if (statusCode >= 400) {
      console.warn(`[SystemEventObserver] API erro: ${method} ${path} - ${statusCode}`);
    }

    // Log para requisições suspeitas (muitas do mesmo IP)
    if (ip) {
      // Aqui você pode implementar lógica de rate limiting ou detecção de abuso
      console.log(`[SystemEventObserver] API request: ${method} ${path} from ${ip}`);
    }
  }

  /**
   * Trata uploads de arquivo
   * @param {Object} data - Dados do upload
   * @param {Object} context - Contexto
   */
  async handleFileUpload(data, context) {
    const { fileName, fileSize, fileType, userId, success, duration } = data;

    if (success) {
      console.log(`[SystemEventObserver] Upload sucesso: ${fileName} (${fileSize} bytes) em ${duration}ms`);
    } else {
      console.error(`[SystemEventObserver] Upload falhou: ${fileName} para usuário ${userId}`);
    }

    // Alerta para arquivos muito grandes
    if (fileSize > 10 * 1024 * 1024) { // 10MB
      console.warn(`[SystemEventObserver] Arquivo grande: ${fileName} (${fileSize} bytes)`);
    }
  }

  /**
   * Trata tentativas de autenticação
   * @param {Object} data - Dados da tentativa
   * @param {Object} context - Contexto
   */
  async handleAuthAttempt(data, context) {
    const { userId, success, method, ip, userAgent } = data;

    if (success) {
      console.log(`[SystemEventObserver] Login sucesso: usuário ${userId} via ${method}`);
    } else {
      console.warn(`[SystemEventObserver] Login falhou: tentativa para ${userId || 'usuário desconhecido'} de ${ip}`);
    }

    // Aqui você pode implementar lógica de detecção de tentativas suspeitas
    if (!success && ip) {
      console.log(`[SystemEventObserver] Tentativa de login suspeita de ${ip}`);
    }
  }

  /**
   * Retorna estatísticas do sistema
   * @returns {Object} Estatísticas compiladas
   */
  getSystemStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Métricas da última hora
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp >= oneHourAgo);
    
    const stats = {
      errors: {
        total: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
        byComponent: Object.fromEntries(this.errorCounts)
      },
      performance: {
        totalOperations: this.performanceMetrics.length,
        recentOperations: recentMetrics.length,
        averageDuration: recentMetrics.length > 0 ? 
          recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length : 0,
        successRate: recentMetrics.length > 0 ?
          recentMetrics.filter(m => m.success).length / recentMetrics.length : 0
      },
      timestamp: now
    };

    return stats;
  }

  /**
   * Limpa métricas antigas
   */
  clearOldMetrics() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp >= oneDayAgo);
    console.log(`[SystemEventObserver] Métricas antigas limpas`);
  }

  /**
   * Retorna o nome do observer
   * @returns {string} Nome do observer
   */
  getName() {
    return this.name;
  }

  /**
   * Retorna os tipos de evento que este observer escuta
   * @returns {Array<string>} Lista de tipos de evento
   */
  getEventTypes() {
    return [
      'system.error',
      'system.performance',
      'system.startup',
      'system.shutdown',
      'database.connection',
      'api.request',
      'file.upload',
      'auth.attempt'
    ];
  }
}

module.exports = SystemEventObserver;
