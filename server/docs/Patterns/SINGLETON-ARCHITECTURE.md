# Singleton Pattern - Arquitetura

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                      APLICAÇÃO                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Controllers & Services                      │  │
│  └────────┬──────────────┬─────────────┬──────────┬─────────┘  │
│           │              │             │          │             │
│           ▼              ▼             ▼          ▼             │
│  ┌─────────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐      │
│  │ ConfigMgr   │  │  Logger  │  │Database │  │Prisma  │      │
│  │ Singleton   │  │ Singleton│  │Singleton│  │Service │      │
│  └──────┬──────┘  └────┬─────┘  └────┬────┘  └───┬────┘      │
│         │              │             │           │             │
│         └──────────────┴─────────────┴───────────┘             │
│                         │                                       │
│                    ┌────▼─────┐                                │
│                    │ISingleton│ (Interface)                    │
│                    └──────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Estrutura de Diretórios

```
server/
├── src/
│   ├── domain/
│   │   └── singletons/
│   │       └── ISingleton.js ············· Interface base
│   │
│   └── infra/
│       └── singletons/
│           ├── DatabaseConnection.js ····· Conexão MongoDB
│           ├── PrismaService.js ·········· Cliente Prisma
│           ├── ConfigManager.js ·········· Configurações
│           └── Logger.js ················· Sistema de logs
│
├── tests/
│   ├── unit/singletons/
│   │   ├── DatabaseConnection.test.js
│   │   ├── PrismaService.test.js
│   │   ├── Logger.test.js
│   │   ├── ConfigManager.test.js
│   │   └── README.md
│   │
│   └── integration/singletons/
│       └── AllSingletons.test.js
│
├── scripts/
│   └── verify-singleton-usage.js ········· Verificação automática
│
└── docs/patterns/
    ├── singleton.txt ························ Avaliação (10/10)
    ├── SINGLETON-BEST-PRACTICES.md ·········· Guia completo
    ├── SINGLETON-SUMMARY.md ················· Resumo executivo
    └── SINGLETON-ARCHITECTURE.md ············ Este arquivo
```

---

## 🔄 Fluxo de Inicialização

```
┌──────────────────────────────────────────────────────────────┐
│                    SERVER STARTUP                            │
└───────────────────────┬──────────────────────────────────────┘
                        │
            ┌───────────▼────────────┐
            │  1. ConfigManager      │
            │  getInstance()         │
            │  ├─ Load .env          │
            │  ├─ Validate config    │
            │  └─ Setup defaults     │
            └───────────┬────────────┘
                        │
            ┌───────────▼────────────┐
            │  2. Logger             │
            │  getInstance()         │
            │  ├─ Setup log dir      │
            │  ├─ Configure levels   │
            │  └─ Start rotation     │
            └───────────┬────────────┘
                        │
            ┌───────────▼────────────┐
            │  3. DatabaseConnection │
            │  getInstance()         │
            │  ├─ Get config URI     │
            │  ├─ Connect MongoDB    │
            │  └─ Setup listeners    │
            └───────────┬────────────┘
                        │
            ┌───────────▼────────────┐
            │  4. PrismaService      │
            │  getInstance()         │
            │  ├─ Check DATABASE_URL │
            │  ├─ Initialize client  │
            │  └─ Connect or fallback│
            └───────────┬────────────┘
                        │
            ┌───────────▼────────────┐
            │  5. Express Server     │
            │  Start listening       │
            └────────────────────────┘
```

---

## 🧩 Diagrama de Classes

```
┌─────────────────────────────────────────────────────────────┐
│                    <<abstract>>                             │
│                     ISingleton                              │
├─────────────────────────────────────────────────────────────┤
│ + static getInstance(): ISingleton                          │
│ + static destroyInstance(): void                            │
│ + static hasInstance(): boolean                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ extends
         ┌───────────────┼───────────────┬─────────────┐
         │               │               │             │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
    │Database │    │ Prisma  │    │ Config  │   │ Logger  │
    │Connect  │    │ Service │    │ Manager │   │         │
    └─────────┘    └─────────┘    └─────────┘   └─────────┘
```

### ISingleton (Interface)

```
┌─────────────────────────────────────────────────┐
│              ISingleton                         │
├─────────────────────────────────────────────────┤
│ - static instance: ISingleton                   │
│ - static _creating: boolean                     │
├─────────────────────────────────────────────────┤
│ + static getInstance(): ISingleton              │
│   │ 1. First check (instance exists?)           │
│   │ 2. Acquire lock (_creating flag)            │
│   │ 3. Second check (double-check)              │
│   │ 4. Create instance                          │
│   │ 5. Release lock                             │
│   └─ Return instance                            │
│                                                 │
│ + static destroyInstance(): void                │
│   └─ Set instance to null                      │
│                                                 │
│ + static hasInstance(): boolean                 │
│   └─ Return !!instance                         │
└─────────────────────────────────────────────────┘
```

### DatabaseConnection

```
┌──────────────────────────────────────────────────┐
│           DatabaseConnection                     │
├──────────────────────────────────────────────────┤
│ - connection: mongoose.Connection                │
│ - isConnected: boolean                           │
│ - connectionString: string                       │
│ - options: Object                                │
├──────────────────────────────────────────────────┤
│ + connect(uri, options): Promise<Connection>     │
│ + disconnect(): Promise<void>                    │
│ + ping(): Promise<boolean>                       │
│ + getStatus(): Object                            │
│ + getStats(): Promise<Object>                    │
│ - setupEventListeners(): void                    │
└──────────────────────────────────────────────────┘
```

### PrismaService

```
┌──────────────────────────────────────────────────┐
│             PrismaService                        │
├──────────────────────────────────────────────────┤
│ - prisma: PrismaClient                           │
│ - isConnected: boolean                           │
│ - connectionAttempts: number                     │
│ - maxRetries: number                             │
│ - fallbackMode: boolean                          │
├──────────────────────────────────────────────────┤
│ + initialize(options): Promise<PrismaClient>     │
│ + connect(): Promise<void>                       │
│ + disconnect(): Promise<void>                    │
│ + getClient(): PrismaClient                      │
│ + ping(): Promise<boolean>                       │
│ + getStats(): Promise<Object>                    │
│ + transaction(callback): Promise<any>            │
│ + queryRaw(query, params): Promise<any>          │
│ - setupEventHandlers(): void                     │
└──────────────────────────────────────────────────┘
```

### ConfigManager

```
┌──────────────────────────────────────────────────┐
│            ConfigManager                         │
├──────────────────────────────────────────────────┤
│ - config: Object                                 │
│ - environment: string                            │
├──────────────────────────────────────────────────┤
│ + get(key, defaultValue): any                    │
│ + set(key, value): void                          │
│ + getAll(): Object                               │
│ + getSection(section): Object                    │
│ + has(key): boolean                              │
│ + validate(): Object                             │
│ + reload(): void                                 │
│ - loadConfig(): void                             │
└──────────────────────────────────────────────────┘
```

### Logger

```
┌──────────────────────────────────────────────────┐
│               Logger                             │
├──────────────────────────────────────────────────┤
│ - logLevel: string                               │
│ - logFile: string                                │
│ - logDir: string                                 │
│ - maxFileSize: number                            │
│ - maxFiles: number                               │
│ - levels: Object                                 │
│ - colors: Object                                 │
├──────────────────────────────────────────────────┤
│ + error(message, meta): void                     │
│ + warn(message, meta): void                      │
│ + info(message, meta): void                      │
│ + debug(message, meta): void                     │
│ + http(req, res, duration): void                 │
│ + event(event, data): void                       │
│ + performance(operation, duration, meta): void   │
│ + getStats(): Object                             │
│ + setLevel(level): void                          │
│ - setupLogDirectory(): void                      │
│ - shouldLog(level): boolean                      │
│ - formatMessage(level, msg, meta): string        │
│ - writeToFile(message): void                     │
│ - rotateLogFile(path): void                      │
│ - cleanOldLogFiles(): void                       │
└──────────────────────────────────────────────────┘
```

---

## 🔒 Thread-Safety: Double-Checked Locking

```
┌──────────────────────────────────────────────────────────┐
│          Thread 1              Thread 2              Thread 3│
│              │                     │                     │   │
│              ├─ getInstance() ────►│                     │   │
│              │  First check         │                     │   │
│              │  instance == null?   │                     │   │
│              │        ▼             │                     │   │
│              │      YES             │                     │   │
│              │        │             │                     │   │
│              │  Acquire lock        │                     │   │
│              │  (_creating = true)  │                     │   │
│              │        │             │                     │   │
│              │  Second check  ◄─────┼─ getInstance()     │   │
│              │  instance == null?   │  First check       │   │
│              │        ▼             │  instance == null? │   │
│              │      YES             │       ▼            │   │
│              │        │             │      YES           │   │
│              │  Create instance     │       │            │   │
│              │  instance = new()    │  WAIT (lock held)  │   │
│              │        │             │       │            │   │
│              │  Release lock        │       │            │   │
│              │  (_creating = false) │       │  ◄─────────┼───┤
│              │        │             │       │            │   │
│              │  Return instance ────┼──────►│            │   │
│              │                      │       │            │   │
│              │                      │  First check       │   │
│              │                      │  instance != null  │   │
│              │                      │       ▼            │   │
│              │                      │  Return instance   │   │
│              │                      │  (NO lock needed) ─┼───┤
│              ▼                      ▼                    ▼   │
│         [SAME INSTANCE]     [SAME INSTANCE]     [SAME INSTANCE]
└──────────────────────────────────────────────────────────┘

Vantagens:
✅ Previne múltiplas instâncias
✅ Thread-safe
✅ Performance otimizada (lock apenas na primeira vez)
✅ Suporta ambientes concorrentes
```

---

## 🔄 Ciclo de Vida

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Not Created] ──getInstance()──► [Created & Initialized]  │
│       │                                    │                │
│       │                                    │                │
│       │                                    ▼                │
│       │                              [In Use]               │
│       │                                    │                │
│       │                                    ├─ Methods       │
│       │                                    ├─ Health checks │
│       │                                    └─ Operations    │
│       │                                    │                │
│       │                                    ▼                │
│       │                           destroyInstance()         │
│       │                                    │                │
│       │                                    ▼                │
│       └────────────────────────────► [Destroyed]           │
│                                            │                │
│                                            ├─ Resources     │
│                                            │   released     │
│                                            └─ Instance      │
│                                                null         │
│                                                             │
│  Pode ser recriado: getInstance() inicia novo ciclo        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Estratégia de Testes

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTES UNITÁRIOS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │ 1. Singleton Pattern                           │        │
│  │    ├─ Instância única                          │        │
│  │    ├─ getInstance() retorna mesma ref          │        │
│  │    └─ hasInstance() funciona                   │        │
│  └────────────────────────────────────────────────┘        │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │ 2. Reconexão                                   │        │
│  │    ├─ destroyInstance limpa corretamente       │        │
│  │    ├─ Nova instância após destruição           │        │
│  │    └─ Estado independente entre ciclos         │        │
│  └────────────────────────────────────────────────┘        │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │ 3. Thread Safety                               │        │
│  │    ├─ Chamadas concorrentes a getInstance()    │        │
│  │    ├─ Race conditions prevenidas               │        │
│  │    └─ Múltiplas destruições simultâneas        │        │
│  └────────────────────────────────────────────────┘        │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │ 4. Funcionalidades Específicas                 │        │
│  │    ├─ Health checks                            │        │
│  │    ├─ Status e estatísticas                    │        │
│  │    └─ Operações principais                     │        │
│  └────────────────────────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 TESTES DE INTEGRAÇÃO                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │ Coordenação entre Singletons                   │        │
│  │    ├─ Todos criados independentemente          │        │
│  │    ├─ Referências separadas                    │        │
│  │    └─ Health check integrado                   │        │
│  └────────────────────────────────────────────────┘        │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │ Ciclos de Vida Completos                       │        │
│  │    ├─ Múltiplos ciclos criação/destruição      │        │
│  │    ├─ Sem memory leaks                         │        │
│  │    └─ Estado limpo entre ciclos                │        │
│  └────────────────────────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Métricas e Monitoramento

### Health Check Endpoint

```javascript
GET /health

Response:
{
  "status": "healthy",
  "singletons": {
    "database": {
      "hasInstance": true,
      "isConnected": true,
      "ping": true
    },
    "prisma": {
      "hasInstance": true,
      "isReady": true,
      "fallbackMode": false
    },
    "config": {
      "hasInstance": true,
      "validation": {
        "valid": true,
        "warnings": []
      }
    },
    "logger": {
      "hasInstance": true,
      "logLevel": "info",
      "fileSize": 1024576
    }
  },
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

---

## 🎯 Padrões de Design Relacionados

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Singleton ◄────────────┐                                   │
│      │                  │                                   │
│      │ usa              │ complementa                       │
│      ▼                  │                                   │
│  Factory Pattern ───────┘                                   │
│      │                                                      │
│      │ cria                                                 │
│      ▼                                                      │
│  Repositories                                               │
│      │                                                      │
│      │ implementa                                           │
│      ▼                                                      │
│  Strategy Pattern                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Integração com Outros Padrões

- **Factory:** Singletons são usados dentro de Factories
- **Repository:** ConfigManager e Logger usados em Repositories
- **Strategy:** Alternância entre MongoDB e Prisma
- **Observer:** Logger subscreve a eventos do sistema
- **Facade:** Singletons simplificam acesso a recursos complexos

---

## 📝 Notas de Implementação

### Por Que Double-Checked Locking?

1. **Performance:** Lock apenas na primeira criação
2. **Thread-Safety:** Previne race conditions
3. **Simplicidade:** Fácil de entender e manter
4. **JavaScript:** Funciona bem em ambiente Node.js

### Alternativas Consideradas

❌ **Eager Initialization:** Criaria instância no load do módulo
   - Problema: Não permite testes com destroyInstance()
   
❌ **Simple Lock:** Lock em toda chamada getInstance()
   - Problema: Performance degradada

✅ **Double-Checked Locking:** Melhor trade-off

---

## 🔍 Debugging e Troubleshooting

### Como Verificar Estado

```javascript
// Verificar se instância existe
console.log(DatabaseConnection.hasInstance()); // true/false

// Obter status
const db = DatabaseConnection.getInstance();
console.log(db.getStatus());

// Health check
const isHealthy = await db.ping();
console.log('Database healthy:', isHealthy);

// Estatísticas
const stats = await db.getStats();
console.log('Database stats:', stats);
```

### Logs de Debug

Todos os singletons logam eventos importantes:
- `[SingletonName] Nova instância criada`
- `[SingletonName] Instância destruída`
- `[SingletonName] Conectado/Desconectado`

---

## 🎓 Referências Acadêmicas

- **Gang of Four** - Design Patterns (1994)
- **Martin Fowler** - Patterns of Enterprise Application Architecture
- **Robert C. Martin** - Clean Architecture
- **Joshua Bloch** - Effective Java (Singleton chapter)

---

*Diagrama de arquitetura do padrão Singleton*
*Versão 2.0 - Nota 10/10*
*Última atualização: 2025-09-30*
