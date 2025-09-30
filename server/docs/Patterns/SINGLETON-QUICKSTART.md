# Singleton Pattern - Guia Rápido

## 🚀 Início Rápido (5 minutos)

### 1. Entendendo o Padrão

**O que é?** Garante uma única instância de uma classe em toda a aplicação.

**Quando usar?**
- ✅ Conexões com banco de dados
- ✅ Configurações globais
- ✅ Sistema de logs
- ✅ Cache global

---

### 2. Como Usar

#### Obter Instância (SEMPRE assim!)

```javascript
const ConfigManager = require('./infra/singletons/ConfigManager');

// ✅ CORRETO
const config = ConfigManager.getInstance();

// ❌ ERRADO - NUNCA FAÇA ISSO!
const config = new ConfigManager();
```

#### Exemplo Completo

```javascript
// No início do arquivo
const ConfigManager = require('./infra/singletons/ConfigManager');
const Logger = require('./infra/singletons/Logger');

// Obter instâncias
const config = ConfigManager.getInstance();
const logger = Logger.getInstance();

// Usar normalmente
const port = config.get('server.port', 3000);
logger.info('Servidor iniciando...', { port });
```

---

### 3. Os 4 Singletons Disponíveis

#### ConfigManager
```javascript
const config = ConfigManager.getInstance();

// Ler configuração
const jwtSecret = config.get('jwt.secret');
const dbUri = config.get('database.uri');

// Definir configuração
config.set('custom.value', 'my-value');

// Obter seção completa
const jwtConfig = config.getSection('jwt');
```

#### Logger
```javascript
const logger = Logger.getInstance();

// Logs
logger.error('Erro crítico', { userId: '123' });
logger.warn('Aviso');
logger.info('Informação');
logger.debug('Debug');

// Logs especializados
logger.http(req, res, duration);
logger.event('user.login', { userId });
logger.performance('query', 1500);
```

#### DatabaseConnection
```javascript
const db = DatabaseConnection.getInstance();

// Conectar
await db.connect(process.env.MONGODB_URI);

// Verificar saúde
const isHealthy = await db.ping();

// Status
const status = db.getStatus();
console.log('Connected:', status.isConnected);

// Desconectar
await db.disconnect();
```

#### PrismaService
```javascript
const prisma = PrismaService.getInstance();

// Inicializar
await prisma.initialize();

// Obter cliente
const client = prisma.getClient();

// Usar
const users = await client.user.findMany();

// Transação
await prisma.transaction(async (tx) => {
  await tx.user.create({ data: { name: 'John' } });
});
```

---

### 4. Comandos Úteis

```bash
# Verificar uso correto de singletons
npm run test:singletons

# Ou alternativamente
npm run patterns:singleton

# Ver documentação resumida
npm run docs:singleton

# Ver guia completo
cat docs/patterns/SINGLETON-BEST-PRACTICES.md
```

---

### 5. No server.js (Inicialização)

```javascript
// server.js
const ConfigManager = require('./infra/singletons/ConfigManager');
const Logger = require('./infra/singletons/Logger');
const DatabaseConnection = require('./infra/singletons/DatabaseConnection');

async function startServer() {
  // 1. Config primeiro
  const config = ConfigManager.getInstance();
  
  // 2. Logger
  const logger = Logger.getInstance();
  logger.info('Iniciando aplicação...');
  
  // 3. Database
  const db = DatabaseConnection.getInstance();
  await db.connect(config.get('database.uri'));
  logger.info('Database conectado');
  
  // 4. Prisma (opcional)
  if (process.env.DATABASE_URL) {
    const prisma = PrismaService.getInstance();
    await prisma.initialize();
    logger.info('Prisma inicializado');
  }
  
  // 5. Seu código aqui...
}

startServer();
```

---

### 6. Em Testes

```javascript
// my-feature.test.js
const DatabaseConnection = require('./infra/singletons/DatabaseConnection');

describe('My Feature', () => {
  // Limpar antes de cada teste
  beforeEach(async () => {
    await DatabaseConnection.destroyInstance();
  });
  
  // Limpar depois de cada teste
  afterEach(async () => {
    await DatabaseConnection.destroyInstance();
  });
  
  it('should work', async () => {
    const db = DatabaseConnection.getInstance();
    // seu teste...
  });
});
```

---

### 7. Verificação de Saúde

```javascript
// Verificar todos os singletons
function checkHealth() {
  return {
    config: ConfigManager.hasInstance(),
    logger: Logger.hasInstance(),
    database: DatabaseConnection.hasInstance() 
      && DatabaseConnection.getInstance().isConnected,
    prisma: PrismaService.hasInstance() 
      && PrismaService.getInstance().isReady()
  };
}

console.log(checkHealth());
// { config: true, logger: true, database: true, prisma: true }
```

---

## ❌ Erros Comuns

### 1. Instanciação Direta
```javascript
// ❌ ERRADO
const db = new DatabaseConnection();

// ✅ CORRETO
const db = DatabaseConnection.getInstance();
```

### 2. Múltiplas Chamadas Desnecessárias
```javascript
// ❌ ERRADO
function doSomething() {
  const logger = Logger.getInstance(); // Chamado toda vez
  logger.info('Fazendo algo');
}

// ✅ CORRETO
const logger = Logger.getInstance(); // Chamado uma vez

function doSomething() {
  logger.info('Fazendo algo');
}
```

### 3. Não Destruir em Testes
```javascript
// ❌ ERRADO
it('test 1', () => {
  const db = DatabaseConnection.getInstance();
  // Não limpa
});

it('test 2', () => {
  const db = DatabaseConnection.getInstance();
  // Pega instância do test 1!
});

// ✅ CORRETO
afterEach(async () => {
  await DatabaseConnection.destroyInstance();
});
```

---

## 📚 Documentação Completa

- **Guia de Melhores Práticas:** `docs/patterns/SINGLETON-BEST-PRACTICES.md`
- **Resumo Executivo:** `docs/patterns/SINGLETON-SUMMARY.md`
- **Arquitetura:** `docs/patterns/SINGLETON-ARCHITECTURE.md`
- **Avaliação:** `docs/patterns/singleton.txt`

---

## 🎯 Checklist

Antes de usar um Singleton:

- [ ] Usar `getInstance()` (nunca `new`)
- [ ] Cachear a instância no início do arquivo
- [ ] Limpar com `destroyInstance()` em testes
- [ ] Verificar saúde com `hasInstance()`
- [ ] Consultar documentação se tiver dúvidas

---

## 💡 Dicas

1. **Performance:** getInstance() é muito rápido (thread-safe)
2. **Testes:** Sempre use destroyInstance() em beforeEach/afterEach
3. **Ordem:** Inicialize Config → Logger → Database → Prisma
4. **Health:** Use ping() para verificar conectividade
5. **Logs:** Todos os singletons logam suas operações

---

## 🆘 Precisa de Ajuda?

1. Rode o verificador: `npm run test:singletons`
2. Veja exemplos: `docs/patterns/SINGLETON-BEST-PRACTICES.md`
3. Consulte testes: `tests/unit/singletons/*.test.js`
4. Leia troubleshooting: Seção "Troubleshooting" no guia

---

**Nota Final:** Este padrão está com nota 10/10 e serve de referência. Siga os exemplos e você terá sucesso! 🎉

*Guia rápido - 5 minutos de leitura*
*Versão 2.0 - Atualizado em 2025-09-30*
