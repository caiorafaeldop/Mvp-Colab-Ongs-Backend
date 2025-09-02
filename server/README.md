# ONG Marketplace API

Backend do sistema de marketplace para ONGs desenvolvido em Clean Architecture seguindo os princípios SOLID.

## 🏗️ Arquitetura

O projeto segue os princípios da Clean Architecture com as seguintes camadas:

- **Domain Layer**: Entidades e regras de negócio
- **Data Layer**: Repositórios e acesso a dados
- **Infrastructure Layer**: Configurações e implementações externas
- **Presentation Layer**: Controllers e rotas
- **Main Layer**: Composição e configuração

## 🚀 Funcionalidades

### Autenticação
- Registro de usuários comuns e organizações
- Login com JWT
- Perfil do usuário

### Marketplace (Bazar)
- Cadastro de produtos por organizações
- Listagem de produtos disponíveis
- Busca de produtos
- Gerenciamento de produtos (editar, deletar, ativar/desativar)
- Link para WhatsApp para contato

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- MongoDB
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório
```bash
git clone <repository-url>
cd server
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL=mongodb://localhost:27017/ong-marketplace
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=development
```

4. Inicie o servidor
```bash
npm start
```

Para desenvolvimento:
```bash
npm run dev
```

## 📚 Documentação da API

### Base URL
```
http://localhost:3000/api
```

### Autenticação

#### Registrar Usuário
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Nome da ONG",
  "email": "ong@example.com",
  "password": "senha123",
  "userType": "organization",
  "phone": "5511999999999"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "ong@example.com",
  "password": "senha123"
}
```

#### Obter Perfil
```http
GET /auth/profile
Authorization: Bearer <token>
```

### Produtos

#### Listar Produtos Disponíveis
```http
GET /products
```

#### Buscar Produtos
```http
GET /products/search?q=termo de busca
```

#### Obter Produto Específico
```http
GET /products/:id
```

#### Criar Produto (Apenas Organizações)
```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nome do Produto",
  "description": "Descrição detalhada do produto",
  "price": 50.00,
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Atualizar Produto (Apenas Organizações)
```http
PUT /products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "description": "Descrição atualizada",
  "price": 75.00,
  "imageUrl": "https://example.com/new-image.jpg"
}
```

#### Deletar Produto (Apenas Organizações)
```http
DELETE /products/:id
Authorization: Bearer <token>
```

#### Ativar/Desativar Produto (Apenas Organizações)
```http
PATCH /products/:id/toggle
Authorization: Bearer <token>
```

#### Listar Produtos da Organização (Apenas Organizações)
```http
GET /my-products
Authorization: Bearer <token>
```

### Health Check
```http
GET /health
```

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Para acessar rotas protegidas, inclua o token no header:

```
Authorization: Bearer <seu-token-jwt>
```

## 📊 Tipos de Usuário

- **common**: Usuário comum que pode visualizar e buscar produtos
- **organization**: Organização que pode criar, editar e gerenciar produtos

## 🔗 WhatsApp Integration

Cada produto possui um método `getWhatsAppLink()` que gera um link direto para o WhatsApp com uma mensagem pré-formatada contendo informações do produto e da organização.

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **CORS** - Cross-origin resource sharing

## 🧪 Testes

Para executar os testes:
```bash
npm test
```

## 📝 Estrutura do Projeto

```
src/
├── domain/
│   ├── entities/
│   │   ├── User.js
│   │   └── Product.js
│   ├── repositories/
│   │   ├── IUserRepository.js
│   │   └── IProductRepository.js
│   └── services/
│       ├── IAuthService.js
│       ├── IProductService.js
│       └── ProductService.js
├── data/
│   └── repositories/
│       ├── MongoUserRepository.js
│       └── MongoProductRepository.js
├── infra/
│   ├── database/
│   │   └── models/
│   │       ├── UserModel.js
│   │       └── ProductModel.js
│   └── services/
│       └── JwtAuthService.js
├── presentation/
│   ├── controllers/
│   │   ├── AuthController.js
│   │   └── ProductController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── routes/
│       ├── authRoutes.js
│       └── productRoutes.js
└── main/
    └── factories/
        └── index.js
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

