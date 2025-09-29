/**
 * EXEMPLO DE INTEGRAÇÃO DAS MELHORIAS NO SERVER PRINCIPAL
 * 
 * Este arquivo mostra como integrar todas as melhorias implementadas:
 * - DTOs + Validação Zod
 * - Use Cases
 * - Logger Centralizado  
 * - Rate Limiting
 * 
 * IMPORTANTE: Este é apenas um exemplo. Para usar no projeto real,
 * você deve adaptar o server.js existente seguindo este padrão.
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Importar melhorias implementadas
const { logger, requestLoggingMiddleware } = require('./src/infra/logger');
const { generalLimiter } = require('./src/presentation/middleware/rateLimiter');
const createEnhancedAuthRoutes = require('./src/presentation/routes/enhancedAuthRoutes');

// Importar factories existentes
const AppFactory = require('./src/main/factories');

async function createEnhancedServer() {
  const app = express();
  
  // 1. CONFIGURAR LOGGER GLOBAL
  logger.info('Iniciando servidor com melhorias implementadas', {
    environment: process.env.NODE_ENV,
    features: ['DTOs', 'Use Cases', 'Centralized Logging', 'Rate Limiting']
  });

  // 2. MIDDLEWARES BÁSICOS
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // 3. CORS CONFIGURADO
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // 4. LOGGING AUTOMÁTICO DE REQUESTS
  app.use(requestLoggingMiddleware);

  // 5. RATE LIMITING GLOBAL
  app.use('/api/', generalLimiter);

  // 6. INICIALIZAR FACTORIES
  const appFactory = new AppFactory();
  await appFactory.initialize();

  logger.info('Factories inicializados', {
    factoryState: appFactory.getFactoryState()
  });

  // 7. HEALTH CHECK MELHORADO
  app.get('/health', (req, res) => {
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      features: {
        logging: true,
        rateLimiting: true,
        dtoValidation: true,
        useCases: true
      },
      factories: appFactory.getFactoryState()
    };

    logger.info('Health check executado', healthInfo);
    res.json(healthInfo);
  });

  // 8. ROTAS MELHORADAS
  
  // Rotas de autenticação V2 (com todas as melhorias)
  const userRepository = appFactory.createUserRepository();
  const authService = appFactory.createAuthService();
  
  app.use('/api/v2/auth', createEnhancedAuthRoutes(userRepository, authService));
  
  // Manter rotas antigas para compatibilidade
  app.use('/api/auth', appFactory.createAuthRoutes());
  app.use('/api/products', appFactory.createProductRoutes());
  app.use('/api/donations', appFactory.createDonationRoutes());
  app.use('/api/upload', appFactory.createUploadRoutes());

  // 9. SWAGGER DOCUMENTATION
  if (process.env.NODE_ENV !== 'production') {
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./src/main/config/swagger');
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // 10. MIDDLEWARE DE ERRO GLOBAL
  app.use((error, req, res, next) => {
    const requestLogger = req.logger || logger;
    
    requestLogger.error('Erro não tratado', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Não vazar informações em produção
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(error.status || 500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_SERVER_ERROR',
      ...(isDevelopment && { 
        details: error.message,
        stack: error.stack 
      })
    });
  });

  // 11. MIDDLEWARE 404
  app.use('*', (req, res) => {
    const requestLogger = req.logger || logger;
    
    requestLogger.warn('Rota não encontrada', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    res.status(404).json({
      success: false,
      message: 'Rota não encontrada',
      error: 'ROUTE_NOT_FOUND',
      path: req.originalUrl
    });
  });

  return app;
}

// EXEMPLO DE INICIALIZAÇÃO
async function startEnhancedServer() {
  try {
    const app = await createEnhancedServer();
    const PORT = process.env.PORT || 3000;
    
    const server = app.listen(PORT, () => {
      logger.info('Servidor iniciado com sucesso', {
        port: PORT,
        environment: process.env.NODE_ENV,
        features: ['DTOs', 'Use Cases', 'Logging', 'Rate Limiting'],
        endpoints: {
          health: `http://localhost:${PORT}/health`,
          authV2: `http://localhost:${PORT}/api/v2/auth`,
          swagger: `http://localhost:${PORT}/api-docs`
        }
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Recebido SIGTERM, iniciando shutdown graceful');
      
      server.close(async () => {
        await logger.flush();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('Recebido SIGINT, iniciando shutdown graceful');
      
      server.close(async () => {
        await logger.flush();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Erro ao iniciar servidor', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// EXEMPLO DE USO DOS DTOS DIRETAMENTE
function exampleDTOUsage() {
  const { CreateUserDTO, LoginDTO } = require('./src/application/dtos');
  
  // Exemplo de validação bem-sucedida
  try {
    const userData = new CreateUserDTO({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'MinhaSenh@123',
      phone: '(11) 99999-9999',
      organizationType: 'ong'
    });
    
    console.log('✅ Dados válidos:', userData.toSafeObject());
  } catch (error) {
    console.log('❌ Erro de validação:', error.message);
  }
  
  // Exemplo de validação com erro
  try {
    const invalidData = new CreateUserDTO({
      name: 'A', // Muito curto
      email: 'email-inválido', // Email inválido
      password: '123' // Senha muito simples
    });
  } catch (error) {
    console.log('❌ Erros encontrados:', error.errors);
  }
}

// EXEMPLO DE USO DO LOGGER
function exampleLoggerUsage() {
  const { logger, createModuleLogger } = require('./src/infra/logger');
  
  // Logger global
  logger.info('Mensagem de informação');
  logger.warn('Mensagem de aviso', { userId: 123 });
  logger.error('Mensagem de erro', { error: 'Algo deu errado' });
  
  // Logger com contexto
  const moduleLogger = createModuleLogger('PaymentService', { version: '1.0.0' });
  moduleLogger.info('Processando pagamento', { amount: 100 });
}

module.exports = {
  createEnhancedServer,
  startEnhancedServer,
  exampleDTOUsage,
  exampleLoggerUsage
};

// Executar se for chamado diretamente
if (require.main === module) {
  startEnhancedServer();
}
