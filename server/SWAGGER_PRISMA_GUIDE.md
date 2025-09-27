# 🚀 Guia de Integração: Swagger + Prisma

Este guia documenta a integração do **Swagger** e **Prisma** no projeto de colaboração entre ONGs, mantendo todos os **15 padrões de projeto** já implementados.

## 📋 Índice

- [🎯 Visão Geral](#-visão-geral)
- [📚 Swagger - Documentação da API](#-swagger---documentação-da-api)
- [🗄️ Prisma - ORM Moderno](#️-prisma---orm-moderno)
- [🏗️ Arquitetura e Padrões](#️-arquitetura-e-padrões)
- [🚀 Como Usar](#-como-usar)
- [🔧 Configuração](#-configuração)
- [📖 Exemplos](#-exemplos)

## 🎯 Visão Geral

### ✅ O que foi implementado:

1. **Swagger UI** - Documentação interativa da API
2. **Prisma ORM** - Cliente de banco de dados type-safe
3. **Strategy Pattern** - Alternância entre MongoDB e Prisma
4. **Singleton Pattern** - PrismaService centralizado
5. **Repository Pattern** - Implementações Prisma mantendo interfaces
6. **Factory Pattern** - PrismaRepositoryFactory com fallback

### 🎨 Padrões de Projeto Mantidos:

- ✅ **Singleton**: PrismaService
- ✅ **Factory**: PrismaRepositoryFactory
- ✅ **Repository**: PrismaUserRepository, PrismaProductRepository, etc.
- ✅ **Strategy**: Escolha entre MongoDB/Prisma
- ✅ **Chain of Responsibility**: Middlewares de autenticação
- ✅ **Observer**: Sistema de eventos mantido
- ✅ **Facade**: Interfaces simplificadas
- ✅ **Decorator**: Middlewares de validação

## 📚 Swagger - Documentação da API

### 🌐 Acesso à Documentação

Após iniciar o servidor, acesse:

- **Swagger UI Principal**: http://localhost:3000/api-docs
- **Documentação Alternativa**: http://localhost:3000/docs
- **JSON Schema**: http://localhost:3000/api-docs.json

### 📋 Endpoints Documentados

#### 🔐 Autenticação (`/api/auth`)
- `POST /register` - Registro de usuários
- `POST /login` - Login com JWT
- `POST /refresh` - Renovação de tokens
- `POST /logout` - Logout seguro
- `GET /profile` - Perfil do usuário

#### 🏥 Sistema (`/health`)
- `GET /health` - Status do sistema

### 🎨 Recursos do Swagger

```javascript
// Exemplo de documentação implementada
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Realiza login do usuário
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 */
```

## 🗄️ Prisma - ORM Moderno

### 📊 Schema do Banco

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  email     String   @unique
  userType  String   // 'common' ou 'organization'
  
  // Relacionamentos
  products                Product[]
  requestedCollaborations Collaboration[] @relation("RequesterCollaborations")
  
  @@map("users")
}
```

### 🏗️ Arquitetura Prisma

```
src/
├── infra/
│   ├── singletons/
│   │   └── PrismaService.js      # Singleton do Prisma
│   └── repositories/
│       ├── PrismaUserRepository.js
│       ├── PrismaProductRepository.js
│       └── PrismaCollaborationRepository.js
└── main/
    └── factories/
        └── PrismaRepositoryFactory.js  # Factory com Strategy
```

### 🔄 Strategy Pattern - MongoDB vs Prisma

```javascript
// Alternância automática entre implementações
const factory = new PrismaRepositoryFactory();

// Configurar estratégia
factory.configure({ 
  databaseStrategy: 'prisma' // ou 'mongodb'
});

// O factory escolhe automaticamente a implementação
const userRepo = await factory.createUserRepository();
// → PrismaUserRepository ou MongoUserRepository
```

## 🏗️ Arquitetura e Padrões

### 🎯 Singleton Pattern - PrismaService

```javascript
class PrismaService extends ISingleton {
  static getInstance() {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  async initialize() {
    this.prisma = new PrismaClient();
    await this.prisma.$connect();
  }
}
```

### 🏭 Factory Pattern - Repository Creation

```javascript
class PrismaRepositoryFactory {
  async createUserRepository() {
    if (this._shouldUsePrisma()) {
      return new PrismaUserRepository();
    }
    return new MongoUserRepository(); // Fallback
  }
}
```

### 📦 Repository Pattern - Interface Consistency

```javascript
// Mesma interface, implementações diferentes
class PrismaUserRepository extends IUserRepository {
  async save(user) {
    const prisma = this._getPrismaClient();
    return await prisma.user.create({ data: user });
  }
}

class MongoUserRepository extends IUserRepository {
  async save(user) {
    return await UserModel.create(user);
  }
}
```

## 🚀 Como Usar

### 1️⃣ Instalar Dependências

```bash
# Já incluídas no package.json
npm install @prisma/client prisma swagger-jsdoc swagger-ui-express
```

### 2️⃣ Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Sincronizar schema (desenvolvimento)
npm run db:push

# Executar migrations (produção)
npm run db:migrate

# Popular banco com dados de exemplo
npm run db:seed
```

### 3️⃣ Iniciar Servidor

```bash
npm run dev
```

### 4️⃣ Acessar Documentação

Abra: http://localhost:3000/api-docs

## 🔧 Configuração

### 🌍 Variáveis de Ambiente

```env
# .env
DATABASE_URL="mongodb://localhost:27017/colab-ongs"
NODE_ENV="development"
JWT_SECRET="seu-jwt-secret"
COOKIE_SECRET="seu-cookie-secret"
```

### ⚙️ Configuração do Factory

```javascript
// Configurar estratégia de banco
const factory = new PrismaRepositoryFactory();
factory.configure({
  databaseStrategy: 'prisma', // 'prisma' ou 'mongodb'
});

// Alternar estratégia em runtime
await factory.switchDatabaseStrategy('mongodb');
```

## 📖 Exemplos

### 🔐 Testando Autenticação via Swagger

1. Acesse http://localhost:3000/api-docs
2. Expanda **Auth** → **POST /api/auth/register**
3. Clique em **"Try it out"**
4. Preencha os dados:

```json
{
  "name": "ONG Exemplo",
  "email": "contato@ongexemplo.org",
  "password": "senha123",
  "userType": "organization",
  "phone": "11999999999"
}
```

5. Execute e copie o `accessToken`
6. Clique em **"Authorize"** (🔒) no topo
7. Cole o token: `Bearer SEU_TOKEN_AQUI`
8. Teste endpoints protegidos como **GET /api/auth/profile**

### 🗄️ Usando Prisma nos Services

```javascript
// Em qualquer service
class UserService {
  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  async createUser(userData) {
    const prisma = this.prismaService.getClient();
    
    return await prisma.user.create({
      data: userData,
      include: {
        products: true,
        notifications: true
      }
    });
  }

  async getUserWithStats(userId) {
    const prisma = this.prismaService.getClient();
    
    const [user, productCount, collaborationCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.product.count({ where: { organizationId: userId } }),
      prisma.collaboration.count({ 
        where: { 
          OR: [
            { requesterOrgId: userId },
            { targetOrgId: userId }
          ]
        }
      })
    ]);

    return { user, stats: { productCount, collaborationCount } };
  }
}
```

### 📊 Queries Avançadas com Prisma

```javascript
// Busca complexa com relacionamentos
const organizationsWithProducts = await prisma.user.findMany({
  where: {
    userType: 'organization',
    products: {
      some: {
        isAvailable: true
      }
    }
  },
  include: {
    products: {
      where: { isAvailable: true },
      take: 5
    },
    _count: {
      select: {
        products: true,
        requestedCollaborations: true
      }
    }
  }
});

// Transações
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.notification.create({
    data: {
      userId: user.id,
      title: 'Bem-vindo!',
      message: 'Conta criada com sucesso'
    }
  });
});
```

## 🎉 Benefícios da Integração

### 📚 Swagger
- ✅ Documentação sempre atualizada
- ✅ Testes interativos da API
- ✅ Geração automática de clientes
- ✅ Padronização de contratos

### 🗄️ Prisma
- ✅ Type safety completo
- ✅ Queries otimizadas
- ✅ Migrations automáticas
- ✅ Relacionamentos intuitivos
- ✅ Transações robustas

### 🏗️ Arquitetura
- ✅ Padrões de projeto mantidos
- ✅ Compatibilidade com MongoDB
- ✅ Escalabilidade melhorada
- ✅ Manutenibilidade aumentada

---

## 🤝 Contribuição

Para adicionar novos endpoints ao Swagger:

1. Adicione a documentação JSDoc nas rotas
2. Use os schemas definidos em `swagger.js`
3. Teste na interface do Swagger UI

Para criar novos repositories Prisma:

1. Implemente a interface existente
2. Use o PrismaService singleton
3. Adicione ao PrismaRepositoryFactory
4. Mantenha compatibilidade com MongoDB

**Desenvolvido com ❤️ seguindo os 15 padrões de projeto**
