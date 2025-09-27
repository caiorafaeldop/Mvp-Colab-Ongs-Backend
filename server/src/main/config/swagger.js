const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Colab ONGs API',
      version: '1.0.0',
      description: 'API para plataforma de colaboração entre ONGs - Sistema de matching e parcerias',
      contact: {
        name: 'Equipe Colab ONGs',
        email: 'contato@colaborongs.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://mvp-colab-ongs-backend.onrender.com'
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Produção' : 'Servidor de Desenvolvimento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint de login',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh token armazenado em cookie httpOnly',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do usuário',
              example: '64f8b2c1e4b0a1b2c3d4e5f6',
            },
            name: {
              type: 'string',
              description: 'Nome do usuário ou organização',
              example: 'ONG Esperança',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
              example: 'contato@ongesperanca.org',
            },
            userType: {
              type: 'string',
              enum: ['common', 'organization'],
              description: 'Tipo de usuário',
              example: 'organization',
            },
            phone: {
              type: 'string',
              description: 'Telefone de contato',
              example: '11999999999',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de última atualização',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do produto',
              example: '64f8b2c1e4b0a1b2c3d4e5f7',
            },
            name: {
              type: 'string',
              description: 'Nome do produto',
              example: 'Cesta Básica Familiar',
            },
            description: {
              type: 'string',
              description: 'Descrição detalhada do produto',
              example: 'Cesta básica completa para uma família de 4 pessoas',
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Preço do produto',
              example: 85.50,
            },
            imageUrls: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri',
              },
              description: 'URLs das imagens do produto',
            },
            organizationId: {
              type: 'string',
              description: 'ID da organização responsável',
            },
            organizationName: {
              type: 'string',
              description: 'Nome da organização responsável',
            },
            isAvailable: {
              type: 'boolean',
              description: 'Disponibilidade do produto',
              default: true,
            },
            category: {
              type: 'string',
              description: 'Categoria do produto',
              example: 'Alimentação',
            },
            stock: {
              type: 'integer',
              description: 'Quantidade em estoque',
              example: 50,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Collaboration: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da colaboração',
            },
            requesterOrgId: {
              type: 'string',
              description: 'ID da organização solicitante',
            },
            requesterOrgName: {
              type: 'string',
              description: 'Nome da organização solicitante',
            },
            targetOrgId: {
              type: 'string',
              description: 'ID da organização alvo',
            },
            targetOrgName: {
              type: 'string',
              description: 'Nome da organização alvo',
            },
            title: {
              type: 'string',
              description: 'Título da colaboração',
              example: 'Parceria para Distribuição de Alimentos',
            },
            description: {
              type: 'string',
              description: 'Descrição detalhada da colaboração',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected', 'completed'],
              description: 'Status da colaboração',
              default: 'pending',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da notificação',
            },
            userId: {
              type: 'string',
              description: 'ID do usuário destinatário',
            },
            title: {
              type: 'string',
              description: 'Título da notificação',
            },
            message: {
              type: 'string',
              description: 'Mensagem da notificação',
            },
            type: {
              type: 'string',
              enum: ['info', 'success', 'warning', 'error', 'collaboration', 'system'],
              description: 'Tipo da notificação',
              default: 'info',
            },
            isRead: {
              type: 'boolean',
              description: 'Status de leitura',
              default: false,
            },
            readAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Data de leitura',
            },
            relatedEntityId: {
              type: 'string',
              nullable: true,
              description: 'ID da entidade relacionada',
            },
            relatedEntityType: {
              type: 'string',
              nullable: true,
              description: 'Tipo da entidade relacionada',
            },
            actionUrl: {
              type: 'string',
              nullable: true,
              description: 'URL de ação da notificação',
            },
            metadata: {
              type: 'object',
              description: 'Metadados adicionais',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Mensagem de erro',
            },
            error: {
              type: 'string',
              description: 'Detalhes do erro',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Mensagem de sucesso',
            },
            data: {
              type: 'object',
              description: 'Dados retornados',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticação e autorização',
      },
      {
        name: 'Users',
        description: 'Gerenciamento de usuários e organizações',
      },
      {
        name: 'Products',
        description: 'Gerenciamento de produtos e serviços',
      },
      {
        name: 'Collaborations',
        description: 'Sistema de colaborações entre organizações',
      },
      {
        name: 'Notifications',
        description: 'Sistema de notificações',
      },
      {
        name: 'Files',
        description: 'Upload e gerenciamento de arquivos',
      },
      {
        name: 'Health',
        description: 'Endpoints de saúde do sistema',
      },
    ],
  },
  apis: [
    './src/presentation/routes/*.js',
    './src/presentation/controllers/*.js',
    './src/main/server.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
