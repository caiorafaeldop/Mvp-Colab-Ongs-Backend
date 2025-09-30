const ISingleton = require('../../domain/singletons/ISingleton');

/**
 * Singleton para gerenciamento de configurações
 * Centraliza todas as configurações da aplicação
 */
class ConfigManager extends ISingleton {
  constructor() {
    super();
    this.config = {};
    this.environment = process.env.NODE_ENV || 'development';
    this.loadConfig();
  }

  /**
   * Obtém instância única do ConfigManager
   * Thread-safe com Double-Checked Locking pattern
   * @returns {ConfigManager} Instância única
   */
  static getInstance() {
    // First check (sem lock) - otimização de performance
    if (!ConfigManager.instance) {
      // Double-checked locking para thread safety
      if (!ConfigManager._creating) {
        ConfigManager._creating = true;
        
        // Second check (com lock)
        if (!ConfigManager.instance) {
          ConfigManager.instance = new ConfigManager();
          console.log('[ConfigManager] Nova instância criada');
        }
        
        ConfigManager._creating = false;
      }
    }
    return ConfigManager.instance;
  }

  /**
   * Carrega configurações do ambiente
   */
  loadConfig() {
    this.config = {
      // Configurações do servidor
      server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        environment: this.environment
      },

      // Configurações do banco de dados
      database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace-ongs',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10
        }
      },

      // Configurações JWT
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-key',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
      },

      // Configurações de cookies
      cookies: {
        secret: process.env.COOKIE_SECRET || 'default-cookie-secret',
        secure: this.environment === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      },

      // Configurações Cloudinary
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        folder: process.env.CLOUDINARY_FOLDER || 'marketplace-ongs'
      },

      // Configurações OpenAI
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 150
      },

      // Configurações de upload
      upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        maxFiles: parseInt(process.env.MAX_FILES) || 10
      },

      // Configurações de CORS
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      },

      // Configurações de rate limiting
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 min
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100
      },

      // Configurações de log
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        file: process.env.LOG_FILE || 'app.log'
      }
    };

    console.log(`[ConfigManager] Configurações carregadas para ambiente: ${this.environment}`);
  }

  /**
   * Obtém configuração por chave
   * @param {string} key - Chave da configuração (ex: 'server.port')
   * @param {*} defaultValue - Valor padrão se não encontrado
   * @returns {*} Valor da configuração
   */
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Define configuração por chave
   * @param {string} key - Chave da configuração
   * @param {*} value - Valor a ser definido
   */
  set(key, value) {
    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
    console.log(`[ConfigManager] Configuração atualizada: ${key} = ${value}`);
  }

  /**
   * Obtém todas as configurações
   * @returns {Object} Todas as configurações
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Obtém configurações por seção
   * @param {string} section - Nome da seção
   * @returns {Object} Configurações da seção
   */
  getSection(section) {
    return this.get(section, {});
  }

  /**
   * Verifica se configuração existe
   * @param {string} key - Chave da configuração
   * @returns {boolean} True se existe
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Valida configurações obrigatórias
   * @returns {Object} Resultado da validação
   */
  validate() {
    const required = [
      'jwt.secret',
      'jwt.refreshSecret',
      'database.uri'
    ];

    const missing = [];
    const warnings = [];

    for (const key of required) {
      if (!this.has(key) || this.get(key) === 'default-secret-key' || this.get(key) === 'default-refresh-secret') {
        if (key.includes('secret')) {
          warnings.push(`${key} está usando valor padrão (inseguro para produção)`);
        } else {
          missing.push(key);
        }
      }
    }

    // Verifica APIs externas
    if (!this.get('cloudinary.apiKey')) {
      warnings.push('Cloudinary não configurado - uploads não funcionarão');
    }

    if (!this.get('openai.apiKey')) {
      warnings.push('OpenAI não configurado - IA não funcionará');
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
      environment: this.environment
    };
  }

  /**
   * Recarrega configurações
   */
  reload() {
    console.log('[ConfigManager] Recarregando configurações...');
    this.loadConfig();
  }

  /**
   * Destrói instância (para testes)
   */
  static destroyInstance() {
    if (ConfigManager.instance) {
      ConfigManager.instance = null;
      console.log('[ConfigManager] Instância destruída');
    }
  }

  /**
   * Verifica se instância existe
   * @returns {boolean} True se instância existe
   */
  static hasInstance() {
    return !!ConfigManager.instance;
  }
}

// Instância única e flag de criação (thread-safety)
ConfigManager.instance = null;
ConfigManager._creating = false;

module.exports = ConfigManager;
