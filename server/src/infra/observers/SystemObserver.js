const IObserver = require('../../domain/observers/IObserver');
const { logger } = require('../logger');

/**
 * Observer para eventos do sistema
 * Monitora erros, performance, segurança e saúde do sistema
 */
class SystemObserver extends IObserver {
  constructor() {
    super();
    this.name = 'SystemObserver';
    this.eventTypes = [
      'system.error',
      'system.warning',
      'system.performance.slow',
      'system.security.alert',
      'system.health.check',
      'system.startup',
      'system.shutdown',
    ];
    this.errorCount = 0;
    this.warningCount = 0;
  }

  async update(event, context) {
    try {
      // Para eventos do sistema, usamos logger apropriado
      const logLevel = this.getLogLevel(event.type);

      logger[logLevel](`[${this.name}] Processando evento: ${event.type}`, {
        eventId: event.id,
        timestamp: event.timestamp,
        data: event.data,
      });

      switch (event.type) {
        case 'system.error':
          await this.handleSystemError(event, context);
          break;
        case 'system.warning':
          await this.handleSystemWarning(event, context);
          break;
        case 'system.performance.slow':
          await this.handlePerformanceSlow(event, context);
          break;
        case 'system.security.alert':
          await this.handleSecurityAlert(event, context);
          break;
        case 'system.health.check':
          await this.handleHealthCheck(event, context);
          break;
        case 'system.startup':
          await this.handleSystemStartup(event, context);
          break;
        case 'system.shutdown':
          await this.handleSystemShutdown(event, context);
          break;
        default:
          logger.warn(`[${this.name}] Tipo de evento não tratado: ${event.type}`);
      }
    } catch (error) {
      logger.error(`[${this.name}] Erro ao processar evento do sistema`, {
        error: error.message,
        eventType: event.type,
        eventId: event.id,
      });
    }
  }

  shouldHandle(event) {
    return this.eventTypes.includes(event.type);
  }

  getName() {
    return this.name;
  }

  getEventTypes() {
    return this.eventTypes;
  }

  getLogLevel(eventType) {
    if (eventType.includes('error')) {
      return 'error';
    }
    if (eventType.includes('warning')) {
      return 'warn';
    }
    if (eventType.includes('security')) {
      return 'warn';
    }
    return 'info';
  }

  // Handlers específicos
  async handleSystemError(event, context) {
    this.errorCount++;

    logger.error(`[${this.name}] Erro no sistema detectado`, {
      errorMessage: event.data.error,
      errorStack: event.data.stack,
      component: event.data.component,
      errorCount: this.errorCount,
    });

    // Lógica adicional:
    // - Se muitos erros, enviar alerta crítico
    // - Registrar em sistema de monitoramento
    // - Notificar equipe de ops
    if (this.errorCount > 10) {
      logger.error(`[${this.name}] ALERTA: Múltiplos erros detectados (${this.errorCount})`);
    }
  }

  async handleSystemWarning(event, context) {
    this.warningCount++;

    logger.warn(`[${this.name}] Aviso do sistema`, {
      warning: event.data.warning,
      component: event.data.component,
      warningCount: this.warningCount,
    });
  }

  async handlePerformanceSlow(event, context) {
    logger.warn(`[${this.name}] Performance lenta detectada`, {
      operation: event.data.operation,
      duration: event.data.duration,
      threshold: event.data.threshold,
      component: event.data.component,
    });

    // Lógica adicional:
    // - Registrar em APM (Application Performance Monitoring)
    // - Alertar se ultrapassar limites críticos
  }

  async handleSecurityAlert(event, context) {
    logger.warn(`[${this.name}] ALERTA DE SEGURANÇA`, {
      alertType: event.data.alertType,
      severity: event.data.severity,
      details: event.data.details,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    // Lógica adicional:
    // - Notificar equipe de segurança
    // - Bloquear IP se necessário
    // - Registrar em SIEM
  }

  async handleHealthCheck(event, context) {
    logger.info(`[${this.name}] Health check executado`, {
      status: event.data.status,
      checks: event.data.checks,
    });

    // Lógica adicional:
    // - Atualizar dashboard de monitoramento
    // - Alertar se algum check falhou
  }

  async handleSystemStartup(event, context) {
    logger.info(`[${this.name}] Sistema iniciado`, {
      version: event.data.version,
      environment: event.data.environment,
      nodeVersion: process.version,
    });

    // Resetar contadores
    this.errorCount = 0;
    this.warningCount = 0;
  }

  async handleSystemShutdown(event, context) {
    logger.info(`[${this.name}] Sistema encerrando`, {
      uptime: event.data.uptime,
      totalErrors: this.errorCount,
      totalWarnings: this.warningCount,
    });
  }

  // Métodos utilitários
  getStatistics() {
    return {
      errorCount: this.errorCount,
      warningCount: this.warningCount,
      observerName: this.name,
    };
  }

  resetCounters() {
    this.errorCount = 0;
    this.warningCount = 0;
    logger.info(`[${this.name}] Contadores resetados`);
  }
}

module.exports = SystemObserver;
