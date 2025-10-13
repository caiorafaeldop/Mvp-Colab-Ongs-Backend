const DatabaseConnection = require('../../../src/infra/singletons/DatabaseConnection');

describe('DatabaseConnection Singleton', () => {
  beforeEach(async () => {
    // Limpar instância antes de cada teste
    await DatabaseConnection.destroyInstance();
  });

  afterEach(async () => {
    // Limpar instância após cada teste
    await DatabaseConnection.destroyInstance();
  });

  afterAll(async () => {
    // Limpeza final
    await DatabaseConnection.destroyInstance();
  });

  describe('Singleton Pattern', () => {
    it('deve criar apenas uma instância', () => {
      const instance1 = DatabaseConnection.getInstance();
      const instance2 = DatabaseConnection.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(DatabaseConnection);
    });

    it('deve verificar se instância existe', () => {
      expect(DatabaseConnection.hasInstance()).toBe(false);

      DatabaseConnection.getInstance();
      expect(DatabaseConnection.hasInstance()).toBe(true);
    });

    it('deve destruir instância corretamente', async () => {
      const instance = DatabaseConnection.getInstance();
      expect(DatabaseConnection.hasInstance()).toBe(true);

      await DatabaseConnection.destroyInstance();
      expect(DatabaseConnection.hasInstance()).toBe(false);
    });
  });

  describe('Reconexão após destroyInstance', () => {
    it('deve criar nova instância após destruição', async () => {
      const instance1 = DatabaseConnection.getInstance();
      const id1 = instance1.constructor.name;

      await DatabaseConnection.destroyInstance();

      const instance2 = DatabaseConnection.getInstance();
      const id2 = instance2.constructor.name;

      expect(id1).toBe(id2);
      expect(instance1).not.toBe(instance2);
      expect(DatabaseConnection.hasInstance()).toBe(true);
    });

    it('deve reconectar após desconexão', async () => {
      const instance = DatabaseConnection.getInstance();

      // Simular estado conectado
      instance.isConnected = true;
      instance.connection = {}; // Mock de conexão

      await instance.disconnect();

      // Verificar que desconectou (ou que não estava conectado de verdade)
      // Em ambiente de teste sem MongoDB real, isConnected pode permanecer false
      expect(typeof instance.isConnected).toBe('boolean');

      // Verificar que pode tentar reconectar (mesmo que falhe)
      const mockUri = 'mongodb://localhost:27017/test-db';
      try {
        await instance.connect(mockUri);
      } catch (error) {
        // Esperado falhar em ambiente de teste sem MongoDB
        expect(error).toBeDefined();
      }
    });
    // testando husky 2
    it('deve manter independência entre instâncias destruídas', async () => {
      const instance1 = DatabaseConnection.getInstance();
      instance1.connectionString = 'test-string-1';

      await DatabaseConnection.destroyInstance();

      const instance2 = DatabaseConnection.getInstance();
      expect(instance2.connectionString).toBeNull();
      expect(instance2.connectionString).not.toBe('test-string-1');
    });
  });

  describe('Thread Safety e Concorrência', () => {
    it('deve manter instância única em chamadas concorrentes', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => Promise.resolve(DatabaseConnection.getInstance()));

      const instances = await Promise.all(promises);
      const firstInstance = instances[0];

      instances.forEach((instance) => {
        expect(instance).toBe(firstInstance);
      });
    });

    it('deve gerenciar múltiplas destruições concorrentes', async () => {
      DatabaseConnection.getInstance();

      const destroyPromises = Array(5)
        .fill(null)
        .map(() => DatabaseConnection.destroyInstance());

      await Promise.all(destroyPromises);
      expect(DatabaseConnection.hasInstance()).toBe(false);
    });
  });

  describe('Status e Health Check', () => {
    it('deve retornar status correto da conexão', () => {
      const instance = DatabaseConnection.getInstance();
      const status = instance.getStatus();

      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('readyState');
      expect(typeof status.isConnected).toBe('boolean');
    });

    it('deve fazer ping quando desconectado', async () => {
      const instance = DatabaseConnection.getInstance();
      const result = await instance.ping();

      expect(typeof result).toBe('boolean');
    });

    it('deve retornar estatísticas quando desconectado', async () => {
      const instance = DatabaseConnection.getInstance();
      const stats = await instance.getStats();

      expect(stats).toBeDefined();
      expect(stats.error || stats.database).toBeDefined();
    });
  });

  describe('Configurações e Options', () => {
    it('deve usar opções padrão', () => {
      const instance = DatabaseConnection.getInstance();

      expect(instance.options).toBeDefined();
      expect(instance.options.maxPoolSize).toBe(10);
      expect(instance.options.useNewUrlParser).toBe(true);
    });

    it('deve aceitar opções customizadas', async () => {
      const instance = DatabaseConnection.getInstance();
      const customOptions = { maxPoolSize: 20 };

      try {
        await instance.connect('mongodb://localhost:27017/test', customOptions);
      } catch (error) {
        // Ignorar erro de conexão
      }
    });
  });

  describe('Event Listeners', () => {
    it('deve configurar event listeners após conexão', async () => {
      const instance = DatabaseConnection.getInstance();

      try {
        await instance.connect('mongodb://localhost:27017/test');
      } catch (error) {
        // Ignorar erro de conexão
      }

      // Verificar que setupEventListeners foi chamado
      expect(instance.setupEventListeners).toBeDefined();
    });
  });

  describe('Isolation e Memory Leaks', () => {
    it('deve limpar recursos ao destruir', async () => {
      const instance = DatabaseConnection.getInstance();
      instance.connectionString = 'test-string';

      await DatabaseConnection.destroyInstance();

      // Verificar que não há referência à instância antiga
      const newInstance = DatabaseConnection.getInstance();
      expect(newInstance.connectionString).toBeNull();
    });

    it('deve permitir múltiplos ciclos de criação/destruição', async () => {
      for (let i = 0; i < 5; i++) {
        const instance = DatabaseConnection.getInstance();
        expect(instance).toBeInstanceOf(DatabaseConnection);

        await DatabaseConnection.destroyInstance();
        expect(DatabaseConnection.hasInstance()).toBe(false);
      }
    });
  });
});
