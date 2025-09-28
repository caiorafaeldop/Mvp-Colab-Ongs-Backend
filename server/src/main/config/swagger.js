<<<<<<< HEAD
/**
 * 📚 CONFIGURAÇÃO DO SWAGGER
 * Documentação interativa da API
 */

=======
>>>>>>> bb733e5715aafdd11592eac04e1581c1453db7b4
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
<<<<<<< HEAD
      title: 'RFCC-Colab API - Sistema de Doações',
      version: '2.0.0',
      description: `
        🎯 **API completa para sistema de doações via Mercado Pago**
        
        ## 💰 Funcionalidades:
        - ✅ Doações únicas e recorrentes
        - ✅ Integração Mercado Pago (PRODUÇÃO)
        - ✅ Webhook automático
        - ✅ Lista pública de doadores
        - ✅ Estatísticas em tempo real
        
        ## 🔑 Credenciais:
        - **Ambiente:** PRODUÇÃO (pagamentos reais)
        - **Conta MP:** 1992214220
        - **Aplicação:** RFCC-Colab
        
        ## 🚀 Como usar:
        1. **Fazer doação:** POST /api/donations/donate
        2. **Ver doações:** GET /api/donations/public
        3. **Estatísticas:** GET /api/donations/stats
      `,
      contact: {
        name: 'RFCC-Colab',
        email: 'caiorafaeldop@gmail.com',
=======
      title: 'Colab ONGs API',
      version: '1.0.0',
      description: 'API para plataforma de colaboração entre ONGs - Sistema de matching e parcerias',
      contact: {
        name: 'Equipe Colab ONGs',
        email: 'contato@colaborongs.com',
>>>>>>> bb733e5715aafdd11592eac04e1581c1453db7b4
      },
    },
    servers: [
      {
<<<<<<< HEAD
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
      {
        url: 'https://unexcitable-escapeless-adalyn.ngrok-free.dev',
        description: 'Servidor público (ngrok)',
      },
    ],
    components: {
      schemas: {
        DonationRequest: {
          type: 'object',
          required: ['amount', 'donorName', 'donorEmail'],
          properties: {
            amount: {
              type: 'number',
              format: 'float',
              minimum: 1,
              example: 25.00,
              description: 'Valor da doação em reais (mínimo R$ 1,00)',
            },
            donorName: {
              type: 'string',
              minLength: 2,
              example: 'Caio Rafael',
              description: 'Nome completo do doador',
            },
            donorEmail: {
              type: 'string',
              format: 'email',
              example: 'caiorafaeldop@gmail.com',
              description: 'Email do doador para contato',
            },
            donorPhone: {
              type: 'string',
              example: '83998632140',
              description: 'Telefone do doador (opcional)',
            },
            donorDocument: {
              type: 'string',
              example: '12345678901',
              description: 'CPF do doador (opcional)',
            },
            donorAddress: {
              type: 'string',
              example: 'Rua das Flores, 123',
              description: 'Endereço completo (opcional)',
            },
            donorCity: {
              type: 'string',
              example: 'João Pessoa',
              description: 'Cidade do doador (opcional)',
            },
            donorState: {
              type: 'string',
              example: 'PB',
              description: 'Estado do doador (opcional)',
            },
            donorZipCode: {
              type: 'string',
              example: '58000-000',
              description: 'CEP do doador (opcional)',
            },
            message: {
              type: 'string',
              example: 'Parabéns pelo trabalho incrível!',
              description: 'Mensagem do doador (opcional)',
            },
            type: {
              type: 'string',
              enum: ['single', 'recurring'],
              default: 'single',
              description: 'Tipo da doação',
            },
            frequency: {
              type: 'string',
              enum: ['monthly', 'weekly', 'yearly'],
              description: 'Frequência (obrigatório para type=recurring)',
            },
            isAnonymous: {
              type: 'boolean',
              default: false,
              description: 'Se o doador quer ficar anônimo',
            },
            showInPublicList: {
              type: 'boolean',
              default: true,
              description: 'Se pode aparecer na lista pública de doadores',
            },
          },
        },
        DonationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            donation: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439012',
                },
                amount: {
                  type: 'number',
                  example: 25.00,
                },
                status: {
                  type: 'string',
                  example: 'pending',
                },
                donorName: {
                  type: 'string',
                  example: 'Caio Rafael',
                },
              },
            },
            payment: {
              type: 'object',
              properties: {
                paymentUrl: {
                  type: 'string',
                  example: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...',
                  description: 'URL para completar o pagamento no Mercado Pago',
                },
                preferenceId: {
                  type: 'string',
                  example: '1992214220-abc123...',
                },
              },
            },
          },
        },
        PublicDonation: {
=======
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
>>>>>>> bb733e5715aafdd11592eac04e1581c1453db7b4
          type: 'object',
          properties: {
            id: {
              type: 'string',
<<<<<<< HEAD
              example: '507f1f77bcf86cd799439012',
            },
            amount: {
              type: 'number',
              example: 25.00,
            },
            donorName: {
              type: 'string',
              example: 'Caio Rafael',
              description: 'Nome do doador ou "Doador Anônimo"',
            },
            message: {
              type: 'string',
              example: 'Parabéns pelo trabalho!',
=======
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
>>>>>>> bb733e5715aafdd11592eac04e1581c1453db7b4
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
<<<<<<< HEAD
              example: '2025-09-27T22:00:00.000Z',
            },
          },
        },
        DonationStats: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            stats: {
              type: 'object',
              properties: {
                totalDonations: {
                  type: 'integer',
                  example: 150,
                  description: 'Total de doações recebidas',
                },
                totalAmount: {
                  type: 'number',
                  example: 2500.00,
                  description: 'Valor total arrecadado (apenas aprovadas)',
                },
                avgAmount: {
                  type: 'number',
                  example: 16.67,
                  description: 'Valor médio por doação',
                },
                approvedDonations: {
                  type: 'integer',
                  example: 145,
                  description: 'Doações aprovadas',
                },
                pendingDonations: {
                  type: 'integer',
                  example: 5,
                  description: 'Doações pendentes',
                },
                singleDonations: {
                  type: 'integer',
                  example: 120,
                  description: 'Doações únicas',
                },
                recurringDonations: {
                  type: 'integer',
                  example: 30,
                  description: 'Doações recorrentes',
                },
                anonymousDonations: {
                  type: 'integer',
                  example: 25,
                  description: 'Doações anônimas',
                },
              },
=======
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
>>>>>>> bb733e5715aafdd11592eac04e1581c1453db7b4
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
<<<<<<< HEAD
            error: {
              type: 'string',
              example: 'Mensagem de erro',
=======
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
>>>>>>> bb733e5715aafdd11592eac04e1581c1453db7b4
            },
          },
        },
      },
    },
    tags: [
      {
<<<<<<< HEAD
        name: 'Donations',
        description: '💰 Sistema de doações via Mercado Pago',
      },
      {
        name: 'Health',
        description: '🏥 Verificação de saúde do sistema',
=======
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
>>>>>>> bb733e5715aafdd11592eac04e1581c1453db7b4
      },
    ],
  },
  apis: [
<<<<<<< HEAD
    './src/main/routes/*.js',
=======
    './src/presentation/routes/*.js',
    './src/presentation/controllers/*.js',
>>>>>>> bb733e5715aafdd11592eac04e1581c1453db7b4
    './src/main/server.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
