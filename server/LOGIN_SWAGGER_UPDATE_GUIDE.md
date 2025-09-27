# 🚀 Login & Swagger Update - Sistema Simplificado

Este guia documenta as melhorias implementadas no sistema de autenticação e documentação Swagger, baseadas no projeto **Maia Advocacia**.

## 📋 Índice

- [🎯 Visão Geral](#-visão-geral)
- [🔐 Novo Sistema de Login](#-novo-sistema-de-login)
- [📚 Swagger Atualizado](#-swagger-atualizado)
- [🚀 Como Usar](#-como-usar)
- [🔧 Comparação dos Sistemas](#-comparação-dos-sistemas)
- [📖 Exemplos Práticos](#-exemplos-práticos)

## 🎯 Visão Geral

### ✅ O que foi implementado:

1. **Sistema de Login Simplificado** - Baseado no projeto Maia Advocacia
2. **Swagger com Autenticação** - Botão "Authorize" funcional
3. **Documentação de Produtos** - Todas as rotas de produtos documentadas
4. **Compatibilidade Mantida** - Sistema antigo preservado como fallback
5. **Padrões de Projeto** - Todos os 15 padrões mantidos

### 🎨 Melhorias Implementadas:

- ✅ **Login sem bugs**: Sistema JWT limpo e eficiente
- ✅ **Swagger funcional**: Botão Authorize integrado
- ✅ **Rotas de produtos**: Documentação completa
- ✅ **Tokens simples**: Access (45min) + Refresh (7 dias)
- ✅ **Sem cookies complexos**: Apenas tokens JWT no header

## 🔐 Novo Sistema de Login

### 🏗️ Arquitetura Simplificada

```
src/
├── infra/
│   ├── services/
│   │   ├── SimpleJwtAuthService.js      # 🆕 Sistema simplificado
│   │   └── EnhancedJwtAuthService.js    # 📦 Sistema antigo (mantido)
│   └── middleware/
│       ├── SimpleAuthMiddleware.js      # 🆕 Middleware limpo
│       └── AuthMiddleware.js            # 📦 Middleware antigo (mantido)
├── presentation/
│   ├── controllers/
│   │   ├── SimpleAuthController.js      # 🆕 Controller simplificado
│   │   └── AuthController.js            # 📦 Controller antigo (mantido)
│   └── routes/
│       ├── simpleAuthRoutes.js          # 🆕 Rotas simplificadas
│       └── authRoutes.js                # 📦 Rotas antigas (mantidas)
```

### 🔄 Fluxo Simplificado

```javascript
// 1. Login
POST /api/auth/login
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}

// Resposta
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// 2. Usar token nas requisições
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 3. Renovar tokens quando necessário
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 🎯 Características do Novo Sistema

| Característica | Sistema Novo | Sistema Antigo |
|---|---|---|
| **Tokens** | JWT simples (45min + 7 dias) | JWT + Cookies httpOnly |
| **Armazenamento** | LocalStorage/SessionStorage | Cookies automáticos |
| **Complexidade** | Baixa | Alta |
| **Bugs** | Zero bugs conhecidos | Problemas com refresh |
| **Compatibilidade** | Swagger nativo | Configuração complexa |

## 📚 Swagger Atualizado

### 🔐 Autenticação no Swagger

1. **Acesse**: http://localhost:3000/api-docs
2. **Clique em "Authorize"** (🔒) no topo direito
3. **Cole o token**: `Bearer SEU_TOKEN_AQUI`
4. **Teste endpoints protegidos**

### 📋 Endpoints Documentados

#### 🔐 Autenticação (`/api/auth`)
- `POST /login` - Login simplificado
- `POST /register` - Registro de usuários
- `POST /refresh` - Renovação de tokens
- `POST /logout` - Logout
- `GET /profile` - Perfil do usuário (protegido)

#### 📦 Produtos (`/api/products`)
- `GET /products` - Listar produtos disponíveis
- `GET /products/search` - Buscar produtos
- `GET /products/{id}` - Obter produto específico
- `GET /products/{id}/whatsapp` - Link do WhatsApp
- `POST /products` - Criar produto (protegido)
- `PUT /products/{id}` - Atualizar produto (protegido)
- `DELETE /products/{id}` - Remover produto (protegido)

#### 🏥 Sistema (`/health`)
- `GET /health` - Status do sistema

### 🎨 Recursos do Swagger

```javascript
// Configuração de segurança
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
    description: "JWT token obtido através do endpoint de login"

// Uso em endpoints protegidos
security:
  - bearerAuth: []
```

## 🚀 Como Usar

### 1️⃣ **Iniciar o Servidor**

```bash
cd server
npm run dev
```

### 2️⃣ **Acessar Swagger**

- **Principal**: http://localhost:3000/api-docs
- **Alternativo**: http://localhost:3000/docs
- **JSON**: http://localhost:3000/api-docs.json

### 3️⃣ **Testar Autenticação**

1. **Registrar usuário** em `POST /api/auth/register`:
```json
{
  "name": "ONG Exemplo",
  "email": "contato@ongexemplo.org",
  "password": "senha123",
  "userType": "organization",
  "phone": "11999999999"
}
```

2. **Fazer login** em `POST /api/auth/login`:
```json
{
  "email": "contato@ongexemplo.org",
  "password": "senha123"
}
```

3. **Copiar accessToken** da resposta

4. **Autorizar no Swagger**:
   - Clique em 🔒 "Authorize"
   - Cole: `Bearer SEU_ACCESS_TOKEN`
   - Clique em "Authorize"

5. **Testar endpoints protegidos**:
   - `GET /api/auth/profile`
   - `POST /api/products`
   - etc.

### 4️⃣ **Testar Sistema Completo**

```bash
# Testar novo sistema
node test-simple-auth.js

# Testar integração Swagger + Prisma
node test-integration.js
```

## 🔧 Comparação dos Sistemas

### 🆕 Sistema Novo (Ativo)
- **Rota**: `/api/auth/*`
- **Service**: `SimpleJwtAuthService`
- **Controller**: `SimpleAuthController`
- **Middleware**: `SimpleAuthMiddleware`
- **Tokens**: JWT puro (Header Authorization)
- **Duração**: Access 45min, Refresh 7 dias
- **Swagger**: Totalmente compatível
- **Bugs**: Nenhum conhecido

### 📦 Sistema Antigo (Mantido)
- **Rota**: `/api/auth-legacy/*`
- **Service**: `EnhancedJwtAuthService`
- **Controller**: `AuthController`
- **Middleware**: `AuthMiddleware`
- **Tokens**: JWT + Cookies httpOnly
- **Duração**: Access 15min, Refresh 7 dias
- **Swagger**: Configuração complexa
- **Bugs**: Problemas com refresh

### 🔄 Alternância Automática

O sistema detecta automaticamente qual implementação usar:

```javascript
// No Factory
const auth = authService.verifyAccessToken ? 
  createSimpleAuthMiddleware(authService) :  // Novo sistema
  authMiddleware(authService);               // Sistema antigo
```

## 📖 Exemplos Práticos

### 🔐 Exemplo Frontend (JavaScript)

```javascript
class AuthManager {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api/auth';
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      
      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('refreshToken', this.refreshToken);
    }
    
    return data;
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    let response = await fetch(url, { ...options, headers });

    // Se token expirou, tentar renovar
    if (response.status === 401) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  }

  async refreshTokens() {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      const data = await response.json();
      
      if (data.success) {
        this.accessToken = data.data.accessToken;
        this.refreshToken = data.data.refreshToken;
        
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Erro ao renovar tokens:', error);
    }
    
    this.logout();
    return false;
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Uso
const auth = new AuthManager();

// Login
await auth.login('usuario@exemplo.com', 'senha123');

// Fazer requisições autenticadas
const response = await auth.makeAuthenticatedRequest('/api/products', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Produto Teste',
    description: 'Descrição do produto',
    category: 'Categoria',
    price: 99.90,
    stock: 10
  })
});
```

### 🧪 Exemplo de Teste

```javascript
// Testar endpoints via código
async function testAPI() {
  const baseUrl = 'http://localhost:3000/api';
  
  // 1. Registrar
  const registerResponse = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'ONG Teste',
      email: 'teste@ong.com',
      password: 'senha123',
      userType: 'organization'
    })
  });
  
  const registerData = await registerResponse.json();
  console.log('Registro:', registerData);
  
  // 2. Login
  const loginResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'teste@ong.com',
      password: 'senha123'
    })
  });
  
  const loginData = await loginResponse.json();
  console.log('Login:', loginData);
  
  // 3. Testar endpoint protegido
  const profileResponse = await fetch(`${baseUrl}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${loginData.data.accessToken}`
    }
  });
  
  const profileData = await profileResponse.json();
  console.log('Perfil:', profileData);
}
```

## 🎉 Benefícios da Atualização

### 🔐 Sistema de Login
- ✅ **Zero bugs**: Sistema testado e estável
- ✅ **Simplicidade**: Menos código, mais confiável
- ✅ **Performance**: Tokens JWT nativos
- ✅ **Compatibilidade**: Funciona em qualquer frontend

### 📚 Swagger
- ✅ **Botão Authorize**: Funcional e intuitivo
- ✅ **Documentação completa**: Todos os endpoints
- ✅ **Testes interativos**: Teste direto na interface
- ✅ **Schemas definidos**: Validação automática

### 🏗️ Arquitetura
- ✅ **Padrões mantidos**: Todos os 15 padrões preservados
- ✅ **Compatibilidade**: Sistema antigo como fallback
- ✅ **Escalabilidade**: Fácil de estender
- ✅ **Manutenibilidade**: Código limpo e organizado

---

## 🤝 Próximos Passos

1. **Testar em produção**: Validar com usuários reais
2. **Migrar frontend**: Atualizar para usar novo sistema
3. **Remover sistema antigo**: Após validação completa
4. **Adicionar mais endpoints**: Colaborações, notificações, etc.

**Desenvolvido com ❤️ baseado no sistema do projeto Maia Advocacia**
