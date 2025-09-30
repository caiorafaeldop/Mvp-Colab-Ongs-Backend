const ConfigManager = require('../../../src/infra/singletons/ConfigManager');

describe('ConfigManager Singleton', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    ConfigManager.destroyInstance();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    ConfigManager.destroyInstance();
    process.env = { ...originalEnv };
  });

  describe('Singleton Pattern', () => {
    it('deve criar apenas uma instância', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ConfigManager);
    });

    it('deve verificar se instância existe', () => {
      expect(ConfigManager.hasInstance()).toBe(false);
      
      ConfigManager.getInstance();
      expect(ConfigManager.hasInstance()).toBe(true);
    });

    it('deve destruir instância corretamente', () => {
      ConfigManager.getInstance();
      expect(ConfigManager.hasInstance()).toBe(true);
      
      ConfigManager.destroyInstance();
      expect(ConfigManager.hasInstance()).toBe(false);
    });
  });

  describe('Reconexão após destroyInstance', () => {
    it('deve criar nova instância após destruição', () => {
      const instance1 = ConfigManager.getInstance();
      ConfigManager.destroyInstance();
      
      const instance2 = ConfigManager.getInstance();
      expect(instance1).not.toBe(instance2);
      expect(ConfigManager.hasInstance()).toBe(true);
    });

    it('deve recarregar configurações em nova instância', () => {
      const instance1 = ConfigManager.getInstance();
      instance1.set('custom.value', 'test123');
      
      ConfigManager.destroyInstance();
      
      const instance2 = ConfigManager.getInstance();
      expect(instance2.get('custom.value')).toBeNull();
    });

    it('deve manter independência entre instâncias', () => {
      const instance1 = ConfigManager.getInstance();
      instance1.config.customField = 'should-not-persist';
      
      ConfigManager.destroyInstance();
      
      const instance2 = ConfigManager.getInstance();
      expect(instance2.config.customField).toBeUndefined();
    });
  });

  describe('Thread Safety', () => {
    it('deve manter instância única em chamadas concorrentes', async () => {
      const promises = Array(10).fill(null).map(() => 
        Promise.resolve(ConfigManager.getInstance())
      );
      
      const instances = await Promise.all(promises);
      const firstInstance = instances[0];
      
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance);
      });
    });

    it('deve gerenciar operações de leitura concorrentes', async () => {
      const config = ConfigManager.getInstance();
      
      const promises = Array(10).fill(null).map(() => 
        Promise.resolve(config.get('server.port'))
      );
      
      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result).toBe(results[0]);
      });
    });

    it('deve gerenciar operações de escrita concorrentes', async () => {
      const config = ConfigManager.getInstance();
      
      const promises = Array(10).fill(null).map((_, i) => 
        Promise.resolve(config.set(`test.key${i}`, `value${i}`))
      );
      
      await Promise.all(promises);
      
      for (let i = 0; i < 10; i++) {
        expect(config.get(`test.key${i}`)).toBe(`value${i}`);
      }
    });
  });

  describe('Configurações Básicas', () => {
    it('deve carregar configurações padrão', () => {
      const config = ConfigManager.getInstance();
      
      expect(config.get('server.port')).toBeDefined();
      expect(config.get('database.uri')).toBeDefined();
      expect(config.get('jwt.secret')).toBeDefined();
    });

    it('deve usar variáveis de ambiente quando disponíveis', () => {
      process.env.PORT = '5000';
      process.env.JWT_SECRET = 'custom-secret';
      
      const config = ConfigManager.getInstance();
      
      expect(config.get('server.port')).toBe('5000');
      expect(config.get('jwt.secret')).toBe('custom-secret');
    });

    it('deve identificar ambiente corretamente', () => {
      process.env.NODE_ENV = 'production';
      const config = ConfigManager.getInstance();
      
      expect(config.environment).toBe('production');
      expect(config.get('server.environment')).toBe('production');
    });
  });

  describe('Get/Set Operations', () => {
    it('deve obter valor por chave simples', () => {
      const config = ConfigManager.getInstance();
      const port = config.get('server.port');
      
      expect(port).toBeDefined();
    });

    it('deve obter valor por chave aninhada', () => {
      const config = ConfigManager.getInstance();
      const secret = config.get('jwt.secret');
      
      expect(secret).toBeDefined();
    });

    it('deve retornar valor padrão quando chave não existe', () => {
      const config = ConfigManager.getInstance();
      const value = config.get('nonexistent.key', 'default');
      
      expect(value).toBe('default');
    });

    it('deve definir valor por chave simples', () => {
      const config = ConfigManager.getInstance();
      config.set('custom.value', 'test');
      
      expect(config.get('custom.value')).toBe('test');
    });

    it('deve definir valor por chave aninhada profunda', () => {
      const config = ConfigManager.getInstance();
      config.set('deep.nested.very.deep.value', 'found');
      
      expect(config.get('deep.nested.very.deep.value')).toBe('found');
    });

    it('deve verificar se chave existe', () => {
      const config = ConfigManager.getInstance();
      
      expect(config.has('server.port')).toBe(true);
      expect(config.has('nonexistent.key')).toBe(false);
    });
  });

  describe('Seções de Configuração', () => {
    it('deve obter seção completa', () => {
      const config = ConfigManager.getInstance();
      const serverConfig = config.getSection('server');
      
      expect(serverConfig).toHaveProperty('port');
      expect(serverConfig).toHaveProperty('host');
    });

    it('deve obter todas as configurações', () => {
      const config = ConfigManager.getInstance();
      const all = config.getAll();
      
      expect(all).toHaveProperty('server');
      expect(all).toHaveProperty('database');
      expect(all).toHaveProperty('jwt');
    });

    it('deve retornar objeto vazio para seção inexistente', () => {
      const config = ConfigManager.getInstance();
      const section = config.getSection('nonexistent');
      
      expect(section).toEqual({});
    });
  });

  describe('Validação de Configurações', () => {
    it('deve validar configurações obrigatórias', () => {
      const config = ConfigManager.getInstance();
      const validation = config.validate();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('missing');
      expect(validation).toHaveProperty('warnings');
    });

    it('deve detectar secrets padrão como warning', () => {
      const config = ConfigManager.getInstance();
      const validation = config.validate();
      
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.includes('secret'))).toBe(true);
    });

    it('deve validar APIs externas', () => {
      const config = ConfigManager.getInstance();
      const validation = config.validate();
      
      const hasCloudinaryWarning = validation.warnings.some(w => 
        w.includes('Cloudinary')
      );
      const hasOpenAIWarning = validation.warnings.some(w => 
        w.includes('OpenAI')
      );
      
      expect(hasCloudinaryWarning || hasOpenAIWarning).toBe(true);
    });
  });

  describe('Reload Configurações', () => {
    it('deve recarregar configurações', () => {
      const config = ConfigManager.getInstance();
      config.set('temp.value', 'will-be-lost');
      
      config.reload();
      
      expect(config.get('temp.value')).toBeNull();
    });

    it('deve recarregar configurações com novas env vars', () => {
      const config = ConfigManager.getInstance();
      
      process.env.PORT = '8080';
      config.reload();
      
      expect(config.get('server.port')).toBe('8080');
    });
  });

  describe('Seções Específicas', () => {
    it('deve ter configurações de servidor', () => {
      const config = ConfigManager.getInstance();
      const server = config.getSection('server');
      
      expect(server).toHaveProperty('port');
      expect(server).toHaveProperty('host');
      expect(server).toHaveProperty('environment');
    });

    it('deve ter configurações de database', () => {
      const config = ConfigManager.getInstance();
      const db = config.getSection('database');
      
      expect(db).toHaveProperty('uri');
      expect(db).toHaveProperty('options');
    });

    it('deve ter configurações de JWT', () => {
      const config = ConfigManager.getInstance();
      const jwt = config.getSection('jwt');
      
      expect(jwt).toHaveProperty('secret');
      expect(jwt).toHaveProperty('refreshSecret');
      expect(jwt).toHaveProperty('accessTokenExpiry');
      expect(jwt).toHaveProperty('refreshTokenExpiry');
    });

    it('deve ter configurações de cookies', () => {
      const config = ConfigManager.getInstance();
      const cookies = config.getSection('cookies');
      
      expect(cookies).toHaveProperty('secret');
      expect(cookies).toHaveProperty('httpOnly');
      expect(cookies).toHaveProperty('secure');
    });

    it('deve ter configurações de CORS', () => {
      const config = ConfigManager.getInstance();
      const cors = config.getSection('cors');
      
      expect(cors).toHaveProperty('origin');
      expect(cors).toHaveProperty('credentials');
      expect(cors).toHaveProperty('methods');
    });

    it('deve ter configurações de rate limiting', () => {
      const config = ConfigManager.getInstance();
      const rateLimit = config.getSection('rateLimit');
      
      expect(rateLimit).toHaveProperty('windowMs');
      expect(rateLimit).toHaveProperty('max');
    });
  });

  describe('Isolation', () => {
    it('deve limpar configurações customizadas ao destruir', () => {
      const instance1 = ConfigManager.getInstance();
      instance1.set('custom.field', 'temporary');
      
      ConfigManager.destroyInstance();
      
      const instance2 = ConfigManager.getInstance();
      expect(instance2.get('custom.field')).toBeNull();
    });

    it('deve permitir múltiplos ciclos de criação/destruição', () => {
      for (let i = 0; i < 5; i++) {
        const instance = ConfigManager.getInstance();
        expect(instance).toBeInstanceOf(ConfigManager);
        
        ConfigManager.destroyInstance();
        expect(ConfigManager.hasInstance()).toBe(false);
      }
    });

    it('não deve vazar memória entre ciclos', () => {
      for (let i = 0; i < 10; i++) {
        const config = ConfigManager.getInstance();
        config.set(`temp${i}`, `value${i}`);
        ConfigManager.destroyInstance();
      }
      
      const newConfig = ConfigManager.getInstance();
      expect(newConfig.get('temp0')).toBeNull();
      expect(newConfig.get('temp9')).toBeNull();
    });
  });
});
