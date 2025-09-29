const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

/**
 * Logger centralizado usando Winston
 * Implementa Singleton pattern para garantir única instância
 */
class Logger {
  constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }

    this.winston = null;
    this.isInitialized = false;
    this.initialize();
    
    Logger.instance = this;
  }

  /**
   * Inicializa o logger com configurações
   */
  initialize() {
    const logDir = path.join(process.cwd(), 'logs');
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    // Formato personalizado para logs
    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` | ${JSON.stringify(meta, null, 2)}`;
        }
        
        return logMessage;
      })
    );

    // Formato para console (desenvolvimento)
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} ${level}: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return logMessage;
      })
    );

    // Configurar transports
    const transports = [];

    // Console transport (sempre ativo em desenvolvimento)
    if (isDevelopment) {
      transports.push(
        new winston.transports.Console({
          level: 'debug',
          format: consoleFormat
        })
      );
    }

    // File transports
    if (isProduction || process.env.LOG_TO_FILE === 'true') {
      // Log de erro (sempre)
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          format: customFormat,
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true
        })
      );

      // Log combinado (info e acima)
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'info',
          format: customFormat,
          maxSize: '20m',
          maxFiles: '30d',
          zippedArchive: true
        })
      );

      // Log de debug (apenas se especificado)
      if (process.env.LOG_DEBUG === 'true') {
        transports.push(
          new DailyRotateFile({
            filename: path.join(logDir, 'debug-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'debug',
            format: customFormat,
            maxSize: '20m',
            maxFiles: '7d',
            zippedArchive: true
          })
        );
      }
    }

    // Criar instância do Winston
    this.winston = winston.createLogger({
      level: isDevelopment ? 'debug' : 'info',
      format: customFormat,
      transports,
      exitOnError: false,
      
      // Tratamento de exceções não capturadas
      exceptionHandlers: isProduction ? [
        new DailyRotateFile({
          filename: path.join(logDir, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d'
        })
      ] : [],
      
      // Tratamento de promises rejeitadas
      rejectionHandlers: isProduction ? [
        new DailyRotateFile({
          filename: path.join(logDir, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d'
        })
      ] : []
    });

    this.isInitialized = true;
    this.info('Logger inicializado', {
      environment: process.env.NODE_ENV,
      logLevel: this.winston.level,
      transportsCount: transports.length
    });
  }

  /**
   * Log de debug
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados adicionais
   */
  debug(message, meta = {}) {
    if (this.winston) {
      this.winston.debug(message, this.sanitizeMeta(meta));
    }
  }

  /**
   * Log de informação
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados adicionais
   */
  info(message, meta = {}) {
    if (this.winston) {
      this.winston.info(message, this.sanitizeMeta(meta));
    }
  }

  /**
   * Log de aviso
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados adicionais
   */
  warn(message, meta = {}) {
    if (this.winston) {
      this.winston.warn(message, this.sanitizeMeta(meta));
    }
  }

  /**
   * Log de erro
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados adicionais
   */
  error(message, meta = {}) {
    if (this.winston) {
      this.winston.error(message, this.sanitizeMeta(meta));
    }
  }

  /**
   * Sanitiza metadados removendo informações sensíveis
   * @param {Object} meta - Metadados originais
   * @returns {Object} Metadados sanitizados
   */
  sanitizeMeta(meta) {
    if (!meta || typeof meta !== 'object') {
      return meta;
    }

    const sensitiveFields = [
      'password', 'token', 'authorization', 'cookie', 'secret',
      'apiKey', 'privateKey', 'accessToken', 'refreshToken'
    ];

    const sanitized = { ...meta };

    // Remove campos sensíveis recursivamente
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      for (const key in obj) {
        if (sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Cria um logger filho com contexto específico
   * @param {Object} context - Contexto a ser adicionado a todos os logs
   * @returns {Object} Logger filho
   */
  child(context) {
    return {
      debug: (message, meta = {}) => this.debug(message, { ...context, ...meta }),
      info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
      error: (message, meta = {}) => this.error(message, { ...context, ...meta })
    };
  }

  /**
   * Retorna instância singleton
   * @returns {Logger} Instância do logger
   */
  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Retorna estatísticas do logger
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      level: this.winston?.level,
      transportsCount: this.winston?.transports?.length || 0,
      environment: process.env.NODE_ENV
    };
  }

  /**
   * Força flush dos logs (útil antes de encerrar aplicação)
   */
  async flush() {
    if (this.winston) {
      return new Promise((resolve) => {
        this.winston.on('finish', resolve);
        this.winston.end();
      });
    }
  }
}

module.exports = Logger;
