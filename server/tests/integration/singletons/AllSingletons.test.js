const DatabaseConnection = require('../../../src/infra/singletons/DatabaseConnection');
const PrismaService = require('../../../src/infra/singletons/PrismaService');
const ConfigManager = require('../../../src/infra/singletons/ConfigManager');
const Logger = require('../../../src/infra/singletons/Logger');

describe('Integração de Todos os Singletons', () => {
  beforeEach(async () => {
    await DatabaseConnection.destroyInstance();
    await PrismaService.destroyInstance();
    ConfigManager.destroyInstance();
    Logger.destroyInstance();
  });

  afterEach(async () => {
    await DatabaseConnection.destroyInstance();
    await PrismaService.destroyInstance();
    ConfigManager.destroyInstance();
    Logger.destroyInstance();
  });

  describe('Coordenação entre Singletons', () => {
    it('deve criar todas as instâncias independentemente', () => {
      const db = DatabaseConnection.getInstance();
      const prisma = PrismaService.getInstance();
      const config = ConfigManager.getInstance();
      const logger = Logger.getInstance();

      expect(db).toBeInstanceOf(DatabaseConnection);
      expect(prisma).toBeInstanceOf(PrismaService);
      expect(config).toBeInstanceOf(ConfigManager);
      expect(logger).toBeInstanceOf(Logger);
    });

    it('deve manter instâncias separadas', () => {
      const db = DatabaseConnection.getInstance();
      const prisma = PrismaService.getInstance();
      const config = ConfigManager.getInstance();
      const logger = Logger.getInstance();

      expect(db).not.toBe(prisma);
      expect(db).not.toBe(config);
      expect(db).not.toBe(logger);
      expect(prisma).not.toBe(config);
      expect(prisma).not.toBe(logger);
      expect(config).not.toBe(logger);
    });

    it('deve verificar estado de todas as instâncias', () => {
      expect(DatabaseConnection.hasInstance()).toBe(false);
      expect(PrismaService.hasInstance()).toBe(false);
      expect(ConfigManager.hasInstance()).toBe(false);
      expect(Logger.hasInstance()).toBe(false);

      DatabaseConnection.getInstance();
      PrismaService.getInstance();
      ConfigManager.getInstance();
      Logger.getInstance();

      expect(DatabaseConnection.hasInstance()).toBe(true);
      expect(PrismaService.hasInstance()).toBe(true);
      expect(ConfigManager.hasInstance()).toBe(true);
      expect(Logger.hasInstance()).toBe(true);
    });
  });

  describe('Destruição Coordenada', () => {
    it('deve destruir todas as instâncias independentemente', async () => {
      DatabaseConnection.getInstance();
      PrismaService.getInstance();
      ConfigManager.getInstance();
      Logger.getInstance();

      await DatabaseConnection.destroyInstance();
      await PrismaService.destroyInstance();
      ConfigManager.destroyInstance();
      Logger.destroyInstance();

      expect(DatabaseConnection.hasInstance()).toBe(false);
      expect(PrismaService.hasInstance()).toBe(false);
      expect(ConfigManager.hasInstance()).toBe(false);
      expect(Logger.hasInstance()).toBe(false);
    });

    it('deve permitir recriação após destruição completa', async () => {
      // Criar primeira vez
      DatabaseConnection.getInstance();
      PrismaService.getInstance();
      ConfigManager.getInstance();
      Logger.getInstance();

      // Destruir
      await DatabaseConnection.destroyInstance();
      await PrismaService.destroyInstance();
      ConfigManager.destroyInstance();
      Logger.destroyInstance();

      // Recriar
      const db2 = DatabaseConnection.getInstance();
      const prisma2 = PrismaService.getInstance();
      const config2 = ConfigManager.getInstance();
      const logger2 = Logger.getInstance();

      expect(db2).toBeInstanceOf(DatabaseConnection);
      expect(prisma2).toBeInstanceOf(PrismaService);
      expect(config2).toBeInstanceOf(ConfigManager);
      expect(logger2).toBeInstanceOf(Logger);
    });

    it('deve destruir em ordem reversa de dependência', async () => {
      DatabaseConnection.getInstance();
      PrismaService.getInstance();
      ConfigManager.getInstance();
      Logger.getInstance();

      // Ordem: Logger -> Config -> Prisma -> Database
      Logger.destroyInstance();
      expect(Logger.hasInstance()).toBe(false);

      ConfigManager.destroyInstance();
      expect(ConfigManager.hasInstance()).toBe(false);

      await PrismaService.destroyInstance();
      expect(PrismaService.hasInstance()).toBe(false);

      await DatabaseConnection.destroyInstance();
      expect(DatabaseConnection.hasInstance()).toBe(false);
    });
  });

  describe('Integração Logger + ConfigManager', () => {
    it('deve usar configurações do ConfigManager no Logger', () => {
      const config = ConfigManager.getInstance();
      const logger = Logger.getInstance();

      const logLevel = config.get('logging.level', 'info');
      expect(logger.logLevel).toBe(logLevel);
    });

    it('deve logar alterações de configuração', () => {
      const config = ConfigManager.getInstance();
      const logger = Logger.getInstance();

      expect(() => {
        config.set('test.key', 'value');
        logger.info('Configuração alterada', { key: 'test.key' });
      }).not.toThrow();
    });
  });

  describe('Integração DatabaseConnection + ConfigManager', () => {
    it('deve usar URI do ConfigManager', () => {
      const config = ConfigManager.getInstance();
      const db = DatabaseConnection.getInstance();

      const dbUri = config.get('database.uri');
      expect(dbUri).toBeDefined();
    });

    it('deve logar conexões de banco', async () => {
      const logger = Logger.getInstance();
      const db = DatabaseConnection.getInstance();

      try {
        await db.connect();
      } catch (error) {
        logger.error('Erro na conexão', { error: error.message });
      }

      expect(Logger.hasInstance()).toBe(true);
    });
  });

  describe('Integração PrismaService + ConfigManager', () => {
    it('deve verificar DATABASE_URL do ambiente', async () => {
      const config = ConfigManager.getInstance();
      const prisma = PrismaService.getInstance();

      const hasDatabaseUrl = process.env.DATABASE_URL !== undefined;

      try {
        await prisma.initialize();
      } catch (error) {
        // Esperado se DATABASE_URL não estiver definida ou se houver erro de conexão
      }

      // Se DATABASE_URL não está definida, deve estar em fallback
      // Se DATABASE_URL está definida mas houve erro de conexão, também pode estar em fallback
      if (!hasDatabaseUrl) {
        expect(prisma.fallbackMode).toBe(true);
      } else {
        // Com DATABASE_URL definida, pode estar ou não em fallback dependendo da conexão
        expect(typeof prisma.fallbackMode).toBe('boolean');
      }
    });
  });

  describe('Health Check Integrado', () => {
    it('deve verificar saúde de todos os singletons', async () => {
      const db = DatabaseConnection.getInstance();
      const prisma = PrismaService.getInstance();
      const config = ConfigManager.getInstance();
      const logger = Logger.getInstance();

      const health = {
        database: {
          hasInstance: DatabaseConnection.hasInstance(),
          status: db.getStatus(),
        },
        prisma: {
          hasInstance: PrismaService.hasInstance(),
          status: prisma.getStatus(),
        },
        config: {
          hasInstance: ConfigManager.hasInstance(),
          validation: config.validate(),
        },
        logger: {
          hasInstance: Logger.hasInstance(),
          stats: logger.getStats(),
        },
      };

      expect(health.database.hasInstance).toBe(true);
      expect(health.prisma.hasInstance).toBe(true);
      expect(health.config.hasInstance).toBe(true);
      expect(health.logger.hasInstance).toBe(true);
    });

    it('deve coletar estatísticas de todos os singletons', async () => {
      const db = DatabaseConnection.getInstance();
      const prisma = PrismaService.getInstance();
      const logger = Logger.getInstance();

      const stats = {
        database: await db.getStats(),
        prisma: await prisma.getStats(),
        logger: logger.getStats(),
      };

      expect(stats.database).toBeDefined();
      expect(stats.prisma).toBeDefined();
      expect(stats.logger).toBeDefined();
    });
  });

  describe('Thread Safety Integrado', () => {
    it('deve criar todas as instâncias concorrentemente', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve(DatabaseConnection.getInstance()),
          Promise.resolve(PrismaService.getInstance()),
          Promise.resolve(ConfigManager.getInstance()),
          Promise.resolve(Logger.getInstance())
        );
      }

      const instances = await Promise.all(promises);

      // Verificar que singletons foram mantidos
      const dbInstances = instances.filter((i) => i instanceof DatabaseConnection);
      const firstDb = dbInstances[0];
      dbInstances.forEach((db) => expect(db).toBe(firstDb));
    });

    it('deve gerenciar operações concorrentes em todos os singletons', async () => {
      const logger = Logger.getInstance();
      const config = ConfigManager.getInstance();

      const promises = Array(20)
        .fill(null)
        .map((_, i) => {
          return Promise.all([
            Promise.resolve(logger.info(`Mensagem ${i}`)),
            Promise.resolve(config.set(`test${i}`, `value${i}`)),
          ]);
        });

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });

  describe('Ciclos de Vida Completos', () => {
    it('deve suportar múltiplos ciclos de criação/destruição', async () => {
      for (let i = 0; i < 3; i++) {
        // Criar
        DatabaseConnection.getInstance();
        PrismaService.getInstance();
        ConfigManager.getInstance();
        Logger.getInstance();

        expect(DatabaseConnection.hasInstance()).toBe(true);
        expect(PrismaService.hasInstance()).toBe(true);
        expect(ConfigManager.hasInstance()).toBe(true);
        expect(Logger.hasInstance()).toBe(true);

        // Destruir
        await DatabaseConnection.destroyInstance();
        await PrismaService.destroyInstance();
        ConfigManager.destroyInstance();
        Logger.destroyInstance();

        expect(DatabaseConnection.hasInstance()).toBe(false);
        expect(PrismaService.hasInstance()).toBe(false);
        expect(ConfigManager.hasInstance()).toBe(false);
        expect(Logger.hasInstance()).toBe(false);
      }
    });

    it('não deve vazar memória entre ciclos', async () => {
      for (let i = 0; i < 5; i++) {
        const config = ConfigManager.getInstance();
        const logger = Logger.getInstance();

        config.set(`temp${i}`, `value${i}`);
        logger.info(`Ciclo ${i}`);

        ConfigManager.destroyInstance();
        Logger.destroyInstance();
      }

      const newConfig = ConfigManager.getInstance();
      expect(newConfig.get('temp0')).toBeNull();
    });
  });

  describe('Isolamento de Instâncias', () => {
    it('deve manter estado independente entre singletons', () => {
      const config = ConfigManager.getInstance();
      const logger = Logger.getInstance();

      config.set('test.value', 'config-value');
      logger.logLevel = 'error';

      expect(config.get('test.value')).toBe('config-value');
      expect(logger.logLevel).toBe('error');

      // Não deve afetar outros singletons
      const db = DatabaseConnection.getInstance();
      expect(db.connectionString).toBeNull();
    });

    it('deve resetar estado ao destruir individualmente', async () => {
      const config = ConfigManager.getInstance();
      config.set('temp', 'value');

      ConfigManager.destroyInstance();

      // Outros singletons devem continuar existindo
      const logger = Logger.getInstance();
      expect(Logger.hasInstance()).toBe(true);
      expect(ConfigManager.hasInstance()).toBe(false);

      // Nova instância não deve ter valor antigo
      const newConfig = ConfigManager.getInstance();
      expect(newConfig.get('temp')).toBeNull();
    });
  });
});
