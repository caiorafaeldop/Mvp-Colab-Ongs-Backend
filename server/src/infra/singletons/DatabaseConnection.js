const mongoose = require('mongoose');
const ISingleton = require('../../domain/singletons/ISingleton');

/**
 * Singleton para conexão com banco de dados
 * Garante uma única conexão MongoDB em toda aplicação
 */
class DatabaseConnection extends ISingleton {
  constructor() {
    super();
    this.connection = null;
    this.isConnected = false;
    this.connectionString = null;
    this.options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };
  }

  /**
   * Obtém instância única do DatabaseConnection
   * Thread-safe com Double-Checked Locking pattern
   * @returns {DatabaseConnection} Instância única
   */
  static getInstance() {
    // First check (sem lock) - otimização de performance
    if (!DatabaseConnection.instance) {
      // Double-checked locking para thread safety
      if (!DatabaseConnection._creating) {
        DatabaseConnection._creating = true;
        
        // Second check (com lock)
        if (!DatabaseConnection.instance) {
          DatabaseConnection.instance = new DatabaseConnection();
          console.log('[DatabaseConnection] Nova instância criada');
        }
        
        DatabaseConnection._creating = false;
      }
    }
    return DatabaseConnection.instance;
  }

  /**
   * Conecta ao banco de dados
   * @param {string} connectionString - String de conexão MongoDB
   * @param {Object} customOptions - Opções personalizadas
   * @returns {Promise<Object>} Conexão estabelecida
   */
  async connect(connectionString, customOptions = {}) {
    try {
      if (this.isConnected && this.connection) {
        console.log('[DatabaseConnection] Usando conexão existente');
        return this.connection;
      }

      this.connectionString = connectionString || process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace-ongs';
      
      const options = { ...this.options, ...customOptions };

      console.log('[DatabaseConnection] Conectando ao MongoDB...');
      this.connection = await mongoose.connect(this.connectionString, options);
      
      this.isConnected = true;
      this.setupEventListeners();

      console.log('[DatabaseConnection] Conectado com sucesso ao MongoDB');
      return this.connection;

    } catch (error) {
      console.error('[DatabaseConnection] Erro ao conectar:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Configura listeners de eventos da conexão
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('[DatabaseConnection] MongoDB conectado');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('[DatabaseConnection] Erro na conexão:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[DatabaseConnection] MongoDB desconectado');
      this.isConnected = false;
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Desconecta do banco de dados
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.connection && this.isConnected) {
        await mongoose.connection.close();
        this.isConnected = false;
        console.log('[DatabaseConnection] Desconectado do MongoDB');
      }
    } catch (error) {
      console.error('[DatabaseConnection] Erro ao desconectar:', error.message);
    }
  }

  /**
   * Obtém status da conexão
   * @returns {Object} Status detalhado
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections)
    };
  }

  /**
   * Testa conectividade
   * @returns {Promise<boolean>} True se conectado
   */
  async ping() {
    try {
      if (!this.isConnected) return false;
      
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      console.error('[DatabaseConnection] Ping falhou:', error.message);
      return false;
    }
  }

  /**
   * Obtém estatísticas da conexão
   * @returns {Promise<Object>} Estatísticas
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        return { error: 'Não conectado' };
      }

      const stats = await mongoose.connection.db.stats();
      return {
        database: stats.db,
        collections: stats.collections,
        objects: stats.objects,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Destrói instância (para testes)
   */
  static async destroyInstance() {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.disconnect();
      DatabaseConnection.instance = null;
      console.log('[DatabaseConnection] Instância destruída');
    }
  }

  /**
   * Verifica se instância existe
   * @returns {boolean} True se instância existe
   */
  static hasInstance() {
    return !!DatabaseConnection.instance;
  }
}

// Instância única e flag de criação (thread-safety)
DatabaseConnection.instance = null;
DatabaseConnection._creating = false;

module.exports = DatabaseConnection;
