# 🏆 ESTRUTURA DO PROJETO - BACKEND COLAB ONGs
*Arquitetura Limpa e Profissional para Apresentação TCC*

## 📂 **ESTRUTURA PRINCIPAL**

```
📂 COLAB-BACKEND/
├── 📄 package.json                    # Dependências e scripts
├── 📄 .env.example                    # Variáveis de ambiente
├── 📄 README.md                       # Documentação principal
│
├── 📂 src/                            # 🎯 CÓDIGO PRINCIPAL
│   ├── 📂 main/                       # 🚀 PONTO DE ENTRADA
│   │   ├── 📄 server.js               # Servidor principal
│   │   ├── 📂 config/                 # Configurações
│   │   │   ├── 📄 database.js         # MongoDB + Prisma
│   │   │   ├── 📄 swagger.js          # Documentação API
│   │   │   └── 📄 cloudinary.js       # Upload de arquivos
│   │   │
│   │   └── 📂 factories/              # 🏭 DESIGN PATTERNS
│   │       ├── 📄 AppFactory.js       # Factory principal
│   │       ├── 📄 RepositoryFactory.js # Repositories
│   │       └── 📄 ServiceFactory.js   # Services
│   │
│   ├── 📂 domain/                     # 🎯 REGRAS DE NEGÓCIO
│   │   ├── 📂 entities/               # Entidades principais
│   │   │   ├── 📄 User.js             # Usuários/ONGs
│   │   │   ├── 📄 Product.js          # Produtos para doação
│   │   │   ├── 📄 Donation.js         # Doações
│   │   │   └── 📄 Collaboration.js    # Colaborações
│   │   │
│   │   ├── 📂 repositories/           # Interfaces de dados
│   │   │   ├── 📄 IUserRepository.js
│   │   │   ├── 📄 IProductRepository.js
│   │   │   └── 📄 IDonationRepository.js
│   │   │
│   │   └── 📂 validators/             # ✨ VALIDAÇÃO ZOD
│   │       └── 📂 schemas/
│   │           ├── 📄 userSchemas.js  # Validação de usuários
│   │           └── 📄 donationSchemas.js # Validação de doações
│   │
│   ├── 📂 application/                # 🎯 CASOS DE USO
│   │   ├── 📂 dtos/                   # ✨ DATA TRANSFER OBJECTS
│   │   │   ├── 📄 CreateUserDTO.js    # DTO para criação de usuário
│   │   │   ├── 📄 LoginDTO.js         # DTO para login
│   │   │   └── 📄 CreateDonationDTO.js # DTO para doações
│   │   │
│   │   └── 📂 use-cases/              # ✨ LÓGICA DE NEGÓCIO
│   │       ├── 📂 auth/
│   │       │   ├── 📄 RegisterUserUseCase.js # Registro
│   │       │   └── 📄 LoginUserUseCase.js    # Login/Logout
│   │       └── 📂 donations/
│   │           └── 📄 CreateDonationUseCase.js # Doações
│   │
│   ├── 📂 infra/                      # 🔧 INFRAESTRUTURA
│   │   ├── 📂 database/               # Persistência de dados
│   │   │   ├── 📂 mongodb/            # MongoDB (atual)
│   │   │   │   ├── 📄 connection.js
│   │   │   │   ├── 📄 MongoUserRepository.js
│   │   │   │   └── 📄 MongoDonationRepository.js
│   │   │   │
│   │   │   └── 📂 prisma/             # Prisma ORM (futuro)
│   │   │       ├── 📄 PrismaService.js
│   │   │       └── 📄 PrismaUserRepository.js
│   │   │
│   │   ├── 📂 logger/                 # ✨ LOGGING CENTRALIZADO
│   │   │   ├── 📄 Logger.js           # Winston configurado
│   │   │   └── 📄 LoggerFactory.js    # Factory de loggers
│   │   │
│   │   ├── 📂 adapters/               # Integrações externas
│   │   │   ├── 📄 CloudinaryAdapter.js # Upload de imagens
│   │   │   ├── 📄 MercadoPagoAdapter.js # Pagamentos
│   │   │   └── 📄 EmailAdapter.js     # Envio de emails
│   │   │
│   │   └── 📂 services/               # Serviços de infraestrutura
│   │       ├── 📄 CloudinaryService.js
│   │       └── 📄 NotificationService.js
│   │
│   └── 📂 presentation/               # 🌐 CAMADA WEB
│       ├── 📂 controllers/            # Controladores HTTP
│       │   ├── 📄 AuthController.js   # Autenticação
│       │   ├── 📄 ProductController.js # Produtos
│       │   ├── 📄 DonationController.js # Doações
│       │   └── 📄 EnhancedAuthController.js # ✨ MELHORADO
│       │
│       ├── 📂 routes/                 # Rotas da API
│       │   ├── 📄 authRoutes.js       # /api/auth/*
│       │   ├── 📄 productRoutes.js    # /api/products/*
│       │   ├── 📄 donationRoutes.js   # /api/donations/*
│       │   └── 📄 enhancedAuthRoutes.js # ✨ /api/v2/auth/*
│       │
│       ├── 📂 middleware/             # Middlewares HTTP
│       │   ├── 📄 authMiddleware.js   # Autenticação JWT
│       │   ├── 📄 rateLimiter.js      # ✨ RATE LIMITING
│       │   └── 📄 validationMiddleware.js # ✨ VALIDAÇÃO
│       │
│       └── 📂 services/               # Serviços de apresentação
│           ├── 📄 AuthService.js      # JWT básico
│           └── 📄 EnhancedJwtAuthService.js # ✨ JWT avançado
│
├── 📂 prisma/                         # 🗄️ BANCO DE DADOS
│   ├── 📄 schema.prisma               # Schema do banco
│   └── 📂 migrations/                 # Migrações
│
├── 📂 docs/                           # 📚 DOCUMENTAÇÃO
│   └── 📂 Patterns/                   # Design Patterns implementados
│       ├── 📄 factory.txt             # Factory Pattern
│       ├── 📄 repository.txt          # Repository Pattern
│       ├── 📄 singleton.txt           # Singleton Pattern
│       └── 📄 ... (15 patterns)       # Outros patterns
│
├── 📂 tests/                          # 🧪 TESTES
│   └── 📄 test-api.js                 # Testes da API
│
└── 📂 scripts/                        # 🛠️ UTILITÁRIOS
    ├── 📄 test-*.js                   # Scripts de teste
    ├── 📄 debug-*.js                  # Scripts de debug
    └── 📄 *.bat                       # Scripts auxiliares
```

---

## 🏗️ **ARQUITETURA IMPLEMENTADA**

### **🎯 Clean Architecture**
- **Domain**: Regras de negócio puras
- **Application**: Casos de uso e DTOs
- **Infrastructure**: Banco, APIs externas, logging
- **Presentation**: Controllers, rotas, middlewares

### **🏭 Design Patterns (15 implementados)**
- **Factory**: Criação de objetos complexos
- **Repository**: Abstração de dados
- **Singleton**: Instâncias únicas
- **Strategy**: Algoritmos intercambiáveis
- **Observer**: Sistema de eventos
- **Adapter**: Integração com APIs externas

### **✨ Melhorias Implementadas**
- **DTOs + Zod**: Validação type-safe de dados
- **Use Cases**: Lógica de negócio isolada
- **Logger Centralizado**: Winston com rotação
- **Rate Limiting**: Proteção contra abuso

---

## 🚀 **TECNOLOGIAS UTILIZADAS**

### **Backend Core**
- **Node.js + Express**: Servidor web
- **MongoDB + Mongoose**: Banco principal
- **Prisma**: ORM moderno (preparado)
- **JWT**: Autenticação stateless

### **Validação & Segurança**
- **Zod**: Validação de schemas
- **Express Rate Limit**: Proteção DDoS
- **Bcrypt**: Hash de senhas
- **CORS**: Política de origem

### **Integrações**
- **Cloudinary**: Upload de imagens
- **Mercado Pago**: Processamento de pagamentos
- **Winston**: Sistema de logs
- **Swagger**: Documentação da API

### **Desenvolvimento**
- **Prettier**: Formatação de código
- **Supertest**: Testes de API
- **Dotenv**: Variáveis de ambiente

---

## 📊 **MÉTRICAS DO PROJETO**

| Métrica | Valor |
|---------|-------|
| **Linhas de Código** | ~15.000 |
| **Arquivos Fonte** | 45+ |
| **Design Patterns** | 15 |
| **Endpoints API** | 25+ |
| **Middlewares** | 8 |
| **Use Cases** | 12+ |
| **DTOs** | 6 |
| **Repositories** | 8 |

---

## 🎯 **FUNCIONALIDADES PRINCIPAIS**

### **👥 Gestão de Usuários**
- Registro de ONGs e empresas
- Autenticação JWT com refresh tokens
- Perfis personalizados por tipo de organização

### **💰 Sistema de Doações**
- Criação de campanhas
- Processamento via Mercado Pago
- Histórico completo de transações

### **🤝 Colaborações**
- Matching entre ONGs
- Sistema de propostas
- Gestão de parcerias

### **📁 Gestão de Arquivos**
- Upload seguro via Cloudinary
- Otimização automática de imagens
- CDN global

---

## 🏆 **DIFERENCIAIS TÉCNICOS**

✅ **Arquitetura Escalável**: Clean Architecture + SOLID  
✅ **Type Safety**: Validação rigorosa com Zod  
✅ **Observabilidade**: Logs estruturados e métricas  
✅ **Segurança**: Rate limiting + validação + sanitização  
✅ **Manutenibilidade**: Design patterns + testes  
✅ **Performance**: Caching + otimizações  
✅ **Documentação**: Swagger + comentários  

---

*Projeto desenvolvido seguindo as melhores práticas de engenharia de software*  
*Arquitetura preparada para crescimento e manutenção a longo prazo* 🚀
