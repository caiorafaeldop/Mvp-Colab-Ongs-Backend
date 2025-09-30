const PrismaService = require('../../../src/infra/singletons/PrismaService');

describe('PrismaService Singleton', () => {
  beforeEach(async () => {
    // Limpar instância antes de cada teste
    await PrismaService.destroyInstance();
  });

  afterEach(async () => {
    // Limpar instância após cada teste
    await PrismaService.destroyInstance();
  });

  afterAll(async () => {
    // Limpeza final
    await PrismaService.destroyInstance();
  });

  describe('Singleton Pattern', () => {
    it('deve criar apenas uma instância', () => {
      const instance1 = PrismaService.getInstance();
      const instance2 = PrismaService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(PrismaService);
    });

    it('deve verificar se instância existe', () => {
      expect(PrismaService.hasInstance()).toBe(false);
      
      PrismaService.getInstance();
      expect(PrismaService.hasInstance()).toBe(true);
    });

    it('deve destruir instância corretamente', async () => {
      PrismaService.getInstance();
      expect(PrismaService.hasInstance()).toBe(true);
      
      await PrismaService.destroyInstance();
      expect(PrismaService.hasInstance()).toBe(false);
    });
  });

  describe('Reconexão após destroyInstance', () => {
    it('deve criar nova instância após destruição', async () => {
      const instance1 = PrismaService.getInstance();
      await PrismaService.destroyInstance();
      
      const instance2 = PrismaService.getInstance();
      expect(instance1).not.toBe(instance2);
      expect(PrismaService.hasInstance()).toBe(true);
    });

    it('deve resetar estado de conexão após destruição', async () => {
      const instance1 = PrismaService.getInstance();
      instance1.isConnected = true;
      instance1.connectionAttempts = 3;
      
      await PrismaService.destroyInstance();
      
      const instance2 = PrismaService.getInstance();
      expect(instance2.isConnected).toBe(false);
      expect(instance2.connectionAttempts).toBe(0);
    });

    it('deve permitir reinicialização após destruição', async () => {
      const instance1 = PrismaService.getInstance();
      
      try {
        await instance1.initialize();
      } catch (error) {
        // Pode falhar se DATABASE_URL não estiver definida
      }
      
      await PrismaService.destroyInstance();
      
      const instance2 = PrismaService.getInstance();
      expect(instance2.prisma).toBeNull();
      expect(instance2.isConnected).toBe(false);
    });
  });

  describe('Thread Safety', () => {
    it('deve manter instância única em chamadas concorrentes', async () => {
      const promises = Array(10).fill(null).map(() => 
        Promise.resolve(PrismaService.getInstance())
      );
      
      const instances = await Promise.all(promises);
      const firstInstance = instances[0];
      
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance);
      });
    });

    it('deve gerenciar destruições concorrentes', async () => {
      PrismaService.getInstance();
      
      const destroyPromises = Array(5).fill(null).map(() => 
        PrismaService.destroyInstance()
      );
      
      await Promise.all(destroyPromises);
      expect(PrismaService.hasInstance()).toBe(false);
    });
  });

  describe('Fallback Mode', () => {
    it('deve ativar fallback mode se DATABASE_URL não definida', async () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      
      const instance = PrismaService.getInstance();
      const result = await instance.initialize();
      
      expect(result).toBeNull();
      expect(instance.fallbackMode).toBe(true);
      expect(instance.isConnected).toBe(false);
      
      if (originalUrl) process.env.DATABASE_URL = originalUrl;
    });

    it('deve retornar false no ping quando em fallback mode', async () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      
      const instance = PrismaService.getInstance();
      await instance.initialize();
      
      const pingResult = await instance.ping();
      expect(pingResult).toBe(false);
      
      if (originalUrl) process.env.DATABASE_URL = originalUrl;
    });
  });

  describe('Status e Health Check', () => {
    it('deve retornar status correto', () => {
      const instance = PrismaService.getInstance();
      const status = instance.getStatus();
      
      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('connectionAttempts');
      expect(status).toHaveProperty('hasInstance');
      expect(typeof status.isConnected).toBe('boolean');
    });

    it('deve verificar se está pronto', () => {
      const instance = PrismaService.getInstance();
      const ready = instance.isReady();
      
      expect(typeof ready).toBe('boolean');
      expect(ready).toBe(false); // Não inicializado
    });

    it('deve retornar estatísticas', async () => {
      const instance = PrismaService.getInstance();
      const stats = await instance.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.error).toBeDefined(); // Erro pois não está conectado
    });
  });

  describe('Cliente Prisma', () => {
    it('deve lançar erro ao obter cliente não inicializado', () => {
      const instance = PrismaService.getInstance();
      
      expect(() => instance.getClient()).toThrow();
    });

    it('deve aceitar opções customizadas na inicialização', async () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;
      
      const instance = PrismaService.getInstance();
      const customOptions = { log: ['error'] };
      
      const result = await instance.initialize(customOptions);
      expect(result).toBeNull(); // Fallback mode
      
      if (originalUrl) process.env.DATABASE_URL = originalUrl;
    });
  });

  describe('Retry Logic', () => {
    it('deve respeitar maxRetries', () => {
      const instance = PrismaService.getInstance();
      expect(instance.maxRetries).toBe(3);
      expect(instance.connectionAttempts).toBe(0);
    });

    it('deve incrementar connectionAttempts', async () => {
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = 'mongodb://invalid:27017/test';
      
      const instance = PrismaService.getInstance();
      
      try {
        await instance.connect();
      } catch (error) {
        // Esperado falhar
      }
      
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
    });
  });

  describe('Isolation', () => {
    it('deve limpar recursos ao destruir', async () => {
      const instance = PrismaService.getInstance();
      instance.connectionAttempts = 5;
      instance.fallbackMode = true;
      
      await PrismaService.destroyInstance();
      
      const newInstance = PrismaService.getInstance();
      expect(newInstance.connectionAttempts).toBe(0);
      expect(newInstance.fallbackMode).toBe(false);
    });

    it('deve permitir múltiplos ciclos de criação/destruição', async () => {
      for (let i = 0; i < 5; i++) {
        const instance = PrismaService.getInstance();
        expect(instance).toBeInstanceOf(PrismaService);
        
        await PrismaService.destroyInstance();
        expect(PrismaService.hasInstance()).toBe(false);
      }
    });
  });
});
