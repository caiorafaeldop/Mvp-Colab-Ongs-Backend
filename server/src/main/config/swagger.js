/**
 * 📚 CONFIGURAÇÃO DO SWAGGER
 * Documentação interativa da API
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
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
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento',
      },
      {
        url: 'https://mvp-colab-ongs-backend.onrender.com',
        description: 'Servidor de produção (Render)',
      },
      {
        url: 'https://unexcitable-escapeless-adalyn.ngrok-free.dev',
        description: 'Servidor público (ngrok)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtido através do endpoint de login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@email.com'
            },
            userType: {
              type: 'string',
              enum: ['common', 'organization'],
              example: 'organization'
            },
            phone: {
              type: 'string',
              example: '11999999999'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'usuario@exemplo.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'minhasenha123'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@exemplo.com'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'minhasenha123'
            },
            userType: {
              type: 'string',
              enum: ['common', 'organization'],
              default: 'common',
              example: 'organization'
            },
            phone: {
              type: 'string',
              example: '11999999999'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                accessToken: {
                  type: 'string',
                  description: 'Token JWT de acesso (45 minutos)'
                },
                refreshToken: {
                  type: 'string',
                  description: 'Token JWT de refresh (7 dias)'
                }
              }
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            name: {
              type: 'string',
              example: 'Cesta Básica Familiar'
            },
            description: {
              type: 'string',
              example: 'Cesta básica completa para uma família de 4 pessoas'
            },
            price: {
              type: 'number',
              format: 'float',
              example: 85.50
            },
            imageUrls: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['https://example.com/cesta1.jpg']
            },
            organizationId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            organizationName: {
              type: 'string',
              example: 'ONG Esperança'
            },
            category: {
              type: 'string',
              example: 'Alimentação'
            },
            stock: {
              type: 'integer',
              example: 50
            },
            isAvailable: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ProductRequest: {
          type: 'object',
          required: ['name', 'description', 'price'],
          properties: {
            name: {
              type: 'string',
              example: 'Cesta Básica Familiar'
            },
            description: {
              type: 'string',
              example: 'Cesta básica completa para uma família de 4 pessoas'
            },
            price: {
              type: 'number',
              format: 'float',
              minimum: 0.01,
              example: 85.50
            },
            imageUrls: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['https://example.com/cesta1.jpg']
            },
            category: {
              type: 'string',
              example: 'Alimentação'
            },
            stock: {
              type: 'integer',
              minimum: 0,
              default: 1,
              example: 50
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Mensagem de erro'
            }
          }
        },
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
            donorName: {
              type: 'string',
              example: 'Caio Rafael',
              description: 'Nome do doador ou "Doador Anônimo"',
            },
            message: {
              type: 'string',
              example: 'Parabéns pelo trabalho!',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
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
            error: {
              type: 'string',
              example: 'Mensagem de erro',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: '🔐 Sistema de autenticação e autorização',
      },
      {
        name: 'Products',
        description: '📦 Gerenciamento de produtos das ONGs',
      },
      {
        name: 'Donations',
        description: '💰 Sistema de doações via Mercado Pago',
      },
      {
        name: 'Health',
        description: '🏥 Verificação de saúde do sistema',
      },
    ],
  },
  apis: [
    './src/main/routes/*.js',
    './src/main/server.js',
    './src/presentation/routes/*.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
