const fs = require('fs');
const path = require('path');
const ISingleton = require('../../domain/singletons/ISingleton');

/**
 * Singleton para sistema de logging
 * Centraliza todos os logs da aplicação
 */
class Logger extends ISingleton {
  constructor() {
    super();
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || 'app.log';
    this.logDir = process.env.LOG_DIR || 'logs';
    this.maxFileSize = parseInt(process.env.LOG_MAX_SIZE) || 10 * 1024 * 1024; // 10MB
    this.maxFiles = parseInt(process.env.LOG_MAX_FILES) || 5;

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    this.colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      info: '\x1b[36m', // Cyan
      debug: '\x1b[37m', // White
      reset: '\x1b[0m',
    };

    this.setupLogDirectory();
  }

  /**
   * Obtém instância única do Logger
   * Thread-safe com Double-Checked Locking pattern
   * @returns {Logger} Instância única
   */
  static getInstance() {
    // First check (sem lock) - otimização de performance
    if (!Logger.instance) {
      // Double-checked locking para thread safety
      if (!Logger._creating) {
        Logger._creating = true;

        // Second check (com lock)
        if (!Logger.instance) {
          Logger.instance = new Logger();
          console.log('[Logger] Nova instância criada');
        }

        Logger._creating = false;
      }
    }
    return Logger.instance;
  }

  /**
   * Configura diretório de logs
   */
  setupLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('[Logger] Erro ao criar diretório de logs:', error.message);
    }
  }

  /**
   * Verifica se deve logar baseado no nível
   * @param {string} level - Nível do log
   * @returns {boolean} True se deve logar
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * Formata mensagem de log
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados adicionais
   * @returns {string} Mensagem formatada
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);

    let formatted = `[${timestamp}] ${levelUpper} ${message}`;

    if (Object.keys(meta).length > 0) {
      formatted += ` | ${JSON.stringify(meta)}`;
    }

    return formatted;
  }

  /**
   * Escreve log no arquivo
   * @param {string} message - Mensagem formatada
   */
  writeToFile(message) {
    try {
      const logPath = path.join(this.logDir, this.logFile);

      // Verifica tamanho do arquivo e faz rotação se necessário
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        if (stats.size > this.maxFileSize) {
          this.rotateLogFile(logPath);
        }
      }

      fs.appendFileSync(logPath, message + '\n');
    } catch (error) {
      console.error('[Logger] Erro ao escrever no arquivo:', error.message);
    }
  }

  /**
   * Faz rotação do arquivo de log
   * @param {string} logPath - Caminho do arquivo atual
   */
  rotateLogFile(logPath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = logPath.replace('.log', `-${timestamp}.log`);

      fs.renameSync(logPath, rotatedPath);

      // Remove arquivos antigos se exceder o limite
      this.cleanOldLogFiles();
    } catch (error) {
      console.error('[Logger] Erro na rotação do log:', error.message);
    }
  }

  /**
   * Remove arquivos de log antigos
   */
  cleanOldLogFiles() {
    try {
      const files = fs
        .readdirSync(this.logDir)
        .filter((file) => file.endsWith('.log') && file !== this.logFile)
        .map((file) => ({
          name: file,
          path: path.join(this.logDir, file),
          time: fs.statSync(path.join(this.logDir, file)).mtime,
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > this.maxFiles) {
        const toDelete = files.slice(this.maxFiles);
        toDelete.forEach((file) => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('[Logger] Erro ao limpar logs antigos:', error.message);
    }
  }

  /**
   * Log de erro
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados
   */
  error(message, meta = {}) {
    if (!this.shouldLog('error')) {
      return;
    }

    const formatted = this.formatMessage('error', message, meta);

    // Console com cor
    console.error(`${this.colors.error}${formatted}${this.colors.reset}`);

    // Arquivo
    this.writeToFile(formatted);
  }

  /**
   * Log de aviso
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados
   */
  warn(message, meta = {}) {
    if (!this.shouldLog('warn')) {
      return;
    }

    const formatted = this.formatMessage('warn', message, meta);

    console.warn(`${this.colors.warn}${formatted}${this.colors.reset}`);
    this.writeToFile(formatted);
  }

  /**
   * Log de informação
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados
   */
  info(message, meta = {}) {
    if (!this.shouldLog('info')) {
      return;
    }

    const formatted = this.formatMessage('info', message, meta);

    console.log(`${this.colors.info}${formatted}${this.colors.reset}`);
    this.writeToFile(formatted);
  }

  /**
   * Log de debug
   * @param {string} message - Mensagem
   * @param {Object} meta - Metadados
   */
  debug(message, meta = {}) {
    if (!this.shouldLog('debug')) {
      return;
    }

    const formatted = this.formatMessage('debug', message, meta);

    console.log(`${this.colors.debug}${formatted}${this.colors.reset}`);
    this.writeToFile(formatted);
  }

  /**
   * Log de requisição HTTP
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {number} duration - Duração em ms
   */
  http(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    };

    const level = res.statusCode >= 400 ? 'error' : 'info';
    const message = `${req.method} ${req.url} ${res.statusCode}`;

    this[level](message, meta);
  }

  /**
   * Log de evento do sistema
   * @param {string} event - Nome do evento
   * @param {Object} data - Dados do evento
   */
  event(event, data = {}) {
    this.info(`Event: ${event}`, { event, ...data });
  }

  /**
   * Log de performance
   * @param {string} operation - Nome da operação
   * @param {number} duration - Duração em ms
   * @param {Object} meta - Metadados adicionais
   */
  performance(operation, duration, meta = {}) {
    const level = duration > 1000 ? 'warn' : 'info';
    this[level](`Performance: ${operation}`, { duration: `${duration}ms`, ...meta });
  }

  /**
   * Obtém estatísticas dos logs
   * @returns {Object} Estatísticas
   */
  getStats() {
    try {
      const logPath = path.join(this.logDir, this.logFile);
      const stats = {
        logLevel: this.logLevel,
        logFile: this.logFile,
        logDir: this.logDir,
        fileExists: fs.existsSync(logPath),
        fileSize: 0,
        totalFiles: 0,
      };

      if (stats.fileExists) {
        stats.fileSize = fs.statSync(logPath).size;
      }

      if (fs.existsSync(this.logDir)) {
        stats.totalFiles = fs
          .readdirSync(this.logDir)
          .filter((file) => file.endsWith('.log')).length;
      }

      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Define nível de log
   * @param {string} level - Novo nível
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.logLevel = level;
      this.info(`Log level alterado para: ${level}`);
    } else {
      this.warn(`Nível de log inválido: ${level}`);
    }
  }

  /**
   * Destrói instância (para testes)
   */
  static destroyInstance() {
    if (Logger.instance) {
      Logger.instance = null;
      console.log('[Logger] Instância destruída');
    }
  }

  /**
   * Verifica se instância existe
   * @returns {boolean} True se instância existe
   */
  static hasInstance() {
    return !!Logger.instance;
  }
}

// Instância única e flag de criação (thread-safety)
Logger.instance = null;
Logger._creating = false;

module.exports = Logger;
