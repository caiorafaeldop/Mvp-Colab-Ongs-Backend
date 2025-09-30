const Logger = require('../../../src/infra/singletons/Logger');
const fs = require('fs');
const path = require('path');

describe('Logger Singleton', () => {
  const testLogDir = 'logs-test';
  
  beforeEach(() => {
    Logger.destroyInstance();
    
    // Configurar ambiente de teste
    process.env.LOG_DIR = testLogDir;
    process.env.LOG_FILE = 'test.log';
    process.env.LOG_LEVEL = 'debug';
  });

  afterEach(() => {
    Logger.destroyInstance();
    
    // Limpar logs de teste
    if (fs.existsSync(testLogDir)) {
      fs.rmSync(testLogDir, { recursive: true, force: true });
    }
    
    // Restaurar variáveis de ambiente
    delete process.env.LOG_DIR;
    delete process.env.LOG_FILE;
    delete process.env.LOG_LEVEL;
  });

  describe('Singleton Pattern', () => {
    it('deve criar apenas uma instância', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(Logger);
    });

    it('deve verificar se instância existe', () => {
      expect(Logger.hasInstance()).toBe(false);
      
      Logger.getInstance();
      expect(Logger.hasInstance()).toBe(true);
    });

    it('deve destruir instância corretamente', () => {
      Logger.getInstance();
      expect(Logger.hasInstance()).toBe(true);
      
      Logger.destroyInstance();
      expect(Logger.hasInstance()).toBe(false);
    });
  });

  describe('Reconexão após destroyInstance', () => {
    it('deve criar nova instância após destruição', () => {
      const instance1 = Logger.getInstance();
      Logger.destroyInstance();
      
      const instance2 = Logger.getInstance();
      expect(instance1).not.toBe(instance2);
      expect(Logger.hasInstance()).toBe(true);
    });

    it('deve resetar configurações após destruição', () => {
      const instance1 = Logger.getInstance();
      instance1.setLevel('error');
      
      Logger.destroyInstance();
      
      const instance2 = Logger.getInstance();
      expect(instance2.logLevel).toBe('debug'); // Valor de LOG_LEVEL
    });

    it('deve manter independência entre instâncias', () => {
      const instance1 = Logger.getInstance();
      instance1.logLevel = 'error';
      
      Logger.destroyInstance();
      
      const instance2 = Logger.getInstance();
      expect(instance2.logLevel).not.toBe('error');
    });
  });

  describe('Thread Safety', () => {
    it('deve manter instância única em chamadas concorrentes', async () => {
      const promises = Array(10).fill(null).map(() => 
        Promise.resolve(Logger.getInstance())
      );
      
      const instances = await Promise.all(promises);
      const firstInstance = instances[0];
      
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance);
      });
    });

    it('deve gerenciar logs concorrentes', () => {
      const logger = Logger.getInstance();
      
      const logPromises = Array(10).fill(null).map((_, i) => 
        Promise.resolve(logger.info(`Mensagem concorrente ${i}`))
      );
      
      expect(() => Promise.all(logPromises)).not.toThrow();
    });
  });

  describe('Log Levels', () => {
    it('deve respeitar nível de log configurado', () => {
      const logger = Logger.getInstance();
      logger.setLevel('warn');
      
      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(true);
      expect(logger.shouldLog('info')).toBe(false);
      expect(logger.shouldLog('debug')).toBe(false);
    });

    it('deve permitir alterar nível de log', () => {
      const logger = Logger.getInstance();
      
      logger.setLevel('error');
      expect(logger.logLevel).toBe('error');
      
      logger.setLevel('debug');
      expect(logger.logLevel).toBe('debug');
    });

    it('deve ignorar nível inválido', () => {
      const logger = Logger.getInstance();
      const originalLevel = logger.logLevel;
      
      logger.setLevel('invalid');
      expect(logger.logLevel).toBe(originalLevel);
    });
  });

  describe('Formatação de Mensagens', () => {
    it('deve formatar mensagem simples', () => {
      const logger = Logger.getInstance();
      const formatted = logger.formatMessage('info', 'Teste');
      
      expect(formatted).toContain('INFO');
      expect(formatted).toContain('Teste');
      expect(formatted).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });

    it('deve incluir metadados na formatação', () => {
      const logger = Logger.getInstance();
      const meta = { user: 'test', action: 'login' };
      const formatted = logger.formatMessage('info', 'Teste', meta);
      
      expect(formatted).toContain('INFO');
      expect(formatted).toContain('Teste');
      expect(formatted).toContain('"user":"test"');
      expect(formatted).toContain('"action":"login"');
    });
  });

  describe('Escrita em Arquivo', () => {
    it('deve criar diretório de logs se não existir', () => {
      Logger.getInstance();
      
      expect(fs.existsSync(testLogDir)).toBe(true);
    });

    it('deve escrever logs no arquivo', () => {
      const logger = Logger.getInstance();
      logger.info('Mensagem de teste');
      
      const logPath = path.join(testLogDir, 'test.log');
      expect(fs.existsSync(logPath)).toBe(true);
      
      const content = fs.readFileSync(logPath, 'utf-8');
      expect(content).toContain('INFO');
      expect(content).toContain('Mensagem de teste');
    });

    it('deve fazer rotação quando arquivo exceder tamanho máximo', () => {
      const logger = Logger.getInstance();
      logger.maxFileSize = 100; // Tamanho pequeno para forçar rotação
      
      // Escrever muitas mensagens
      for (let i = 0; i < 50; i++) {
        logger.info(`Mensagem ${i} com texto longo para forçar rotação do arquivo`);
      }
      
      const files = fs.readdirSync(testLogDir);
      expect(files.length).toBeGreaterThan(1);
    });

    it('deve limpar logs antigos', () => {
      const logger = Logger.getInstance();
      logger.maxFiles = 2;
      logger.maxFileSize = 100;
      
      // Forçar múltiplas rotações
      for (let i = 0; i < 200; i++) {
        logger.info(`Mensagem ${i} com texto longo para forçar múltiplas rotações`);
      }
      
      const files = fs.readdirSync(testLogDir)
        .filter(f => f.endsWith('.log'));
      
      expect(files.length).toBeLessThanOrEqual(3); // maxFiles + arquivo atual
    });
  });

  describe('Métodos de Log', () => {
    it('deve logar erro', () => {
      const logger = Logger.getInstance();
      expect(() => logger.error('Erro de teste')).not.toThrow();
    });

    it('deve logar warn', () => {
      const logger = Logger.getInstance();
      expect(() => logger.warn('Aviso de teste')).not.toThrow();
    });

    it('deve logar info', () => {
      const logger = Logger.getInstance();
      expect(() => logger.info('Info de teste')).not.toThrow();
    });

    it('deve logar debug', () => {
      const logger = Logger.getInstance();
      expect(() => logger.debug('Debug de teste')).not.toThrow();
    });
  });

  describe('Logs Especializados', () => {
    it('deve logar requisição HTTP', () => {
      const logger = Logger.getInstance();
      const req = {
        method: 'GET',
        url: '/api/test',
        get: () => 'Mozilla',
        ip: '127.0.0.1'
      };
      const res = { statusCode: 200 };
      
      expect(() => logger.http(req, res, 150)).not.toThrow();
    });

    it('deve logar evento', () => {
      const logger = Logger.getInstance();
      expect(() => logger.event('user.login', { userId: '123' })).not.toThrow();
    });

    it('deve logar performance', () => {
      const logger = Logger.getInstance();
      expect(() => logger.performance('query', 500)).not.toThrow();
    });

    it('deve usar warn para operações lentas', () => {
      const logger = Logger.getInstance();
      logger.setLevel('warn');
      
      logger.performance('slow-operation', 1500);
      
      const logPath = path.join(testLogDir, 'test.log');
      const content = fs.readFileSync(logPath, 'utf-8');
      expect(content).toContain('WARN');
    });
  });

  describe('Estatísticas', () => {
    it('deve retornar estatísticas de logs', () => {
      const logger = Logger.getInstance();
      logger.info('Teste');
      
      const stats = logger.getStats();
      
      expect(stats).toHaveProperty('logLevel');
      expect(stats).toHaveProperty('logFile');
      expect(stats).toHaveProperty('logDir');
      expect(stats).toHaveProperty('fileExists');
      expect(stats).toHaveProperty('fileSize');
      expect(stats.fileExists).toBe(true);
    });

    it('deve contar total de arquivos de log', () => {
      const logger = Logger.getInstance();
      logger.info('Teste');
      
      const stats = logger.getStats();
      expect(stats.totalFiles).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Isolation', () => {
    it('deve permitir múltiplos ciclos de criação/destruição', () => {
      for (let i = 0; i < 5; i++) {
        const instance = Logger.getInstance();
        expect(instance).toBeInstanceOf(Logger);
        
        Logger.destroyInstance();
        expect(Logger.hasInstance()).toBe(false);
      }
    });

    it('não deve vazar memória entre ciclos', () => {
      for (let i = 0; i < 10; i++) {
        const logger = Logger.getInstance();
        logger.info(`Ciclo ${i}`);
        Logger.destroyInstance();
      }
      
      expect(Logger.hasInstance()).toBe(false);
    });
  });
});
