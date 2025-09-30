const { PrismaClient } = require('@prisma/client');
const ISingleton = require('../../domain/singletons/ISingleton');

/**
 * Singleton para cliente Prisma
 * Garante uma única instância do PrismaClient em toda aplicação
 * Implementa padrões de design: Singleton + Facade
 */
class PrismaService extends ISingleton {
  constructor() {
    super();
    this.prisma = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.fallbackMode = false;
  }

  /**
   * Obtém instância única do PrismaService
   * Thread-safe com Double-Checked Locking pattern
   * @returns {PrismaService} Instância única
   */
  static getInstance() {
    // First check (sem lock) - otimização de performance
    if (!PrismaService.instance) {
      // Double-checked locking para thread safety
      if (!PrismaService._creating) {
        PrismaService._creating = true;

        // Second check (com lock)
        if (!PrismaService.instance) {
          PrismaService.instance = new PrismaService();
          console.log('[PrismaService] Nova instância criada');
        }

        PrismaService._creating = false;
      }
    }
    return PrismaService.instance;
  }

  /**
   * Inicializa o cliente Prisma
   * @param {Object} options - Opções de configuração
   * @returns {Promise<PrismaClient>} Cliente Prisma inicializado
   */
  async initialize(options = {}) {
    try {
      if (this.prisma && this.isConnected) {
        console.log('[PrismaService] Usando cliente existente');
        return this.prisma;
      }

      // Verifica se DATABASE_URL está definida
      if (!process.env.DATABASE_URL) {
        console.warn('[PrismaService] DATABASE_URL não definida - Prisma desabilitado');
        this.fallbackMode = true;
        this.isConnected = false;
        return null;
      }

      console.log('[PrismaService] Inicializando cliente Prisma...');

      const defaultOptions = {
        log:
          process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
      };

      this.prisma = new PrismaClient({
        ...defaultOptions,
        ...options,
      });

      // Conectar ao banco
      await this.connect();

      console.log('[PrismaService] Cliente Prisma inicializado com sucesso');
      return this.prisma;
    } catch (error) {
      console.error('[PrismaService] Erro ao inicializar:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Conecta ao banco de dados via Prisma
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      if (this.isConnected) {
        return;
      }

      // Verifica se DATABASE_URL está definida
      if (!process.env.DATABASE_URL) {
        console.warn('[PrismaService] DATABASE_URL não definida - modo fallback ativado');
        this.fallbackMode = true;
        this.isConnected = false;
        return;
      }

      this.connectionAttempts++;
      console.log(
        `[PrismaService] Tentativa de conexão ${this.connectionAttempts}/${this.maxRetries}`
      );

      // Testa a conexão
      await this.prisma.$connect();

      // Verifica se a conexão está funcionando
      await this.prisma.$queryRaw`SELECT 1`;

      this.isConnected = true;
      this.connectionAttempts = 0;
      this.fallbackMode = false;

      console.log('[PrismaService] Conectado ao banco de dados via Prisma');

      // Configura handlers de eventos
      this.setupEventHandlers();
    } catch (error) {
      console.error('[PrismaService] Erro na conexão:', error.message);
      this.isConnected = false;
      this.fallbackMode = true;

      if (this.connectionAttempts < this.maxRetries) {
        console.log(`[PrismaService] Tentando reconectar em 2 segundos...`);
        setTimeout(() => this.connect(), 2000);
      } else {
        throw new Error(`Falha ao conectar após ${this.maxRetries} tentativas: ${error.message}`);
      }
    }
  }

  /**
   * Configura handlers de eventos do processo
   */
  setupEventHandlers() {
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('[PrismaService] Recebido SIGINT, desconectando...');
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('[PrismaService] Recebido SIGTERM, desconectando...');
      await this.disconnect();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('[PrismaService] Uncaught Exception:', error);
      await this.disconnect();
      process.exit(1);
    });
  }

  /**
   * Desconecta do banco de dados
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.prisma && this.isConnected) {
        await this.prisma.$disconnect();
        this.isConnected = false;
        console.log('[PrismaService] Desconectado do banco de dados');
      }
    } catch (error) {
      console.error('[PrismaService] Erro ao desconectar:', error.message);
    }
  }

  /**
   * Obtém o cliente Prisma
   * @returns {PrismaClient|null} Cliente Prisma ou null se não inicializado
   */
  getClient() {
    if (!this.prisma) {
      throw new Error('PrismaService não foi inicializado. Chame initialize() primeiro.');
    }
    return this.prisma;
  }

  /**
   * Verifica se o serviço está conectado
   * @returns {boolean} True se conectado
   */
  isReady() {
    return this.isConnected && this.prisma !== null;
  }

  /**
   * Testa a conectividade com o banco
   * @returns {Promise<boolean>} True se conectado
   */
  async ping() {
    try {
      if (!this.prisma || !this.isConnected) {
        return false;
      }

      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('[PrismaService] Ping falhou:', error.message);
      return false;
    }
  }

  /**
   * Obtém estatísticas do banco de dados
   * @returns {Promise<Object>} Estatísticas
   */
  async getStats() {
    try {
      if (!this.isReady()) {
        return { error: 'PrismaService não está pronto' };
      }

      // Contagem de registros por tabela
      const [userCount, productCount, collaborationCount, notificationCount, fileCount] =
        await Promise.all([
          this.prisma.user.count(),
          this.prisma.product.count(),
          this.prisma.collaboration.count(),
          this.prisma.notification.count(),
          this.prisma.file.count(),
        ]);

      return {
        isConnected: this.isConnected,
        tables: {
          users: userCount,
          products: productCount,
          collaborations: collaborationCount,
          notifications: notificationCount,
          files: fileCount,
        },
        totalRecords: userCount + productCount + collaborationCount + notificationCount + fileCount,
        connectionAttempts: this.connectionAttempts,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Executa uma transação
   * @param {Function} callback - Função que recebe o cliente Prisma
   * @returns {Promise<any>} Resultado da transação
   */
  async transaction(callback) {
    if (!this.isReady()) {
      throw new Error('PrismaService não está pronto para transações');
    }

    return await this.prisma.$transaction(callback);
  }

  /**
   * Executa query raw
   * @param {string} query - Query SQL/MongoDB
   * @param {...any} params - Parâmetros da query
   * @returns {Promise<any>} Resultado da query
   */
  async queryRaw(query, ...params) {
    if (!this.isReady()) {
      throw new Error('PrismaService não está pronto para queries');
    }

    return await this.prisma.$queryRaw(query, ...params);
  }

  /**
   * Destrói instância (para testes)
   */
  static async destroyInstance() {
    if (PrismaService.instance) {
      await PrismaService.instance.disconnect();
      PrismaService.instance = null;
      console.log('[PrismaService] Instância destruída');
    }
  }

  /**
   * Verifica se instância existe
   * @returns {boolean} True se instância existe
   */
  static hasInstance() {
    return !!PrismaService.instance;
  }

  /**
   * Obtém status detalhado do serviço
   * @returns {Object} Status completo
   */
  getStatus() {
    return {
      isInitialized: !!this.prisma,
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      maxRetries: this.maxRetries,
      hasInstance: PrismaService.hasInstance(),
    };
  }
}

// Instância única e flag de criação (thread-safety)
PrismaService.instance = null;
PrismaService._creating = false;

module.exports = PrismaService;
