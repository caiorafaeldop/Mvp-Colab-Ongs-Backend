// Load environment variables
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const env = require('./config/env');
const { connectDB } = require('./config/database');
const AppFactory = require('./factories');
const {
  deduplicationMiddleware,
  getDeduplicationStats,
} = require('../presentation/middleware/RequestDeduplicationMiddleware');
const {
  errorHandler,
  notFoundHandler,
  requestCorrelationMiddleware,
  requestContextMiddleware,
  RateLimitPresets,
} = require('../presentation/middleware');
// const uploadRouter = require("../presentation/routes/UploadRoutes"); // Temporariamente comentado

const app = express();
const port = process.env.PORT || 3000;

// Pretty-print JSON responses
app.enable('json spaces');
app.enable('strict routing');

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sem origin (ex: mobile apps, Postman, arquivos locais)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://rede-feminina-colab.onrender.com', // Frontend em produção
      'https://mvp-colab-ongs-backend.onrender.com', // Backend em produção
    ];

    // Permitir arquivos locais (file://) para testes
    if (origin && origin.startsWith('file://')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('[CORS] Origin não permitida:', origin);
      // Em desenvolvimento, permitir qualquer origin
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      callback(null, true); // Permitir temporariamente para testes
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
};

// CHAIN OF RESPONSIBILITY PATTERN: Cadeia de middlewares globais
// Cada middleware processa a requisição e passa para o próximo via next()
app.use(cors(corsOptions)); // CHAIN HANDLER 1: CORS
app.use(cookieParser(process.env.COOKIE_SECRET)); // CHAIN HANDLER 2: Cookies
app.use(express.json()); // CHAIN HANDLER 3: JSON parsing
app.use(express.urlencoded({ extended: true })); // CHAIN HANDLER 4: URL encoding
app.use(express.static('public')); // CHAIN HANDLER 5: Static files
// Static serve for local uploads when using LocalStorageBridge
app.use('/uploads', express.static(env.LOCAL_UPLOAD_PATH));

// CHAIN HANDLER 6: Correlação de requests (requestId e logger contextual)
app.use(requestCorrelationMiddleware);
app.use(requestContextMiddleware);

// CHAIN HANDLER 7: Rate limiting geral
app.use(RateLimitPresets.general());

// CHAIN HANDLER 8: Middleware de deduplicação de requisições
app.use(deduplicationMiddleware);

// SWAGGER DOCUMENTATION SETUP
// Configuração do Swagger UI com tema personalizado
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 5px; }
  `,
  customSiteTitle: 'Colab ONGs API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
};

// Swagger routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerOptions));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerOptions));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// Database connection
connectDB();

// Global singleton para evitar múltiplas inicializações
let appFactory = null;
let eventManager = null;
let isInitializing = false;

// Initialize application factory and all components (apenas uma vez)
const initializeApp = async () => {
  if (appFactory && appFactory.initialized) {
    console.log('[Server] AppFactory já inicializado, reutilizando instância');
    return appFactory;
  }

  if (isInitializing) {
    console.log('[Server] Inicialização já em andamento, aguardando...');
    return new Promise((resolve) => {
      const checkInit = setInterval(() => {
        if (appFactory && appFactory.initialized) {
          clearInterval(checkInit);
          resolve(appFactory);
        }
      }, 100);
    });
  }

  isInitializing = true;

  try {
    console.log('[Server] Inicializando AppFactory...');

    if (!appFactory) {
      appFactory = new AppFactory();
    }

    // Initialize the main factory first
    await appFactory.initialize();
    console.log('[Server] AppFactory inicializado com sucesso');

    // Initialize Observer system with ObserverFactory
    if (!eventManager) {
      eventManager = await appFactory.createEventManager();

      // Register all observers using ObserverFactory
      console.log('[Server] Registrando observers...');
      const observerFactory = appFactory.createObserverFactory();
      observerFactory.setEventManager(eventManager);
      observerFactory.registerAllObservers();
      console.log('[Server] Observers registrados com sucesso');

      // Emit system startup event
      await eventManager.emit('system.startup', {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        startTime: new Date(),
        factoryState: appFactory.getFactoryState(),
      });
    }

    console.log('[Server] Sistema completo inicializado com sucesso');
    console.log(
      '[Server] Estado do Factory:',
      JSON.stringify(appFactory.getFactoryState(), null, 2)
    );

    isInitializing = false;
    return appFactory;
  } catch (error) {
    console.error('[Server] Erro ao inicializar sistema:', error.message);
    console.error('[Server] Stack trace:', error.stack);
    isInitializing = false;
    throw error;
  }
};

// Inicializar imediatamente
initializeApp();

// Routes - these will be created after factory initialization

// NOVO SISTEMA DE AUTENTICAÇÃO SIMPLIFICADO (baseado no Maia Advocacia)
app.use('/api/auth', (req, res, next) => {
  if (!appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: 'Server is still initializing, please try again in a moment',
    });
  }
  return appFactory.createSimpleAuthRoutes()(req, res, next);
});

// Sistema antigo (mantido para compatibilidade)
app.use('/api/auth-legacy', (req, res, next) => {
  if (!appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: 'Server is still initializing, please try again in a moment',
    });
  }
  return appFactory.createAuthRoutes()(req, res, next);
});

app.use('/api', (req, res, next) => {
  if (!appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: 'Server is still initializing, please try again in a moment',
    });
  }
  return appFactory.createProductRoutes()(req, res, next);
});

// CHAIN OF RESPONSIBILITY PATTERN: Rota de upload integrada ao sistema de factories
app.use('/api/upload', (req, res, next) => {
  if (!appFactory || !appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: 'Server is still initializing, please try again in a moment',
    });
  }
  return appFactory.createUploadRoutes()(req, res, next);
});

// Rotas de doações (Mercado Pago)
app.use('/api/donations', (req, res, next) => {
  if (!appFactory || !appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: 'Server is still initializing, please try again in a moment',
    });
  }
  return appFactory.createDonationRoutes()(req, res, next);
});

// Rotas de doadores de destaque (Admin only)
app.use('/api/top-donors', (req, res, next) => {
  console.log('=== [SERVER] Requisição para /api/top-donors ===');
  console.log('[SERVER] Method:', req.method);
  console.log('[SERVER] URL completa:', req.url);
  console.log(
    '[SERVER] Headers Authorization:',
    req.headers.authorization ? 'Presente' : 'Ausente'
  );

  if (!appFactory || !appFactory.initialized) {
    console.error('[SERVER] AppFactory não inicializado!');
    return res.status(503).json({
      success: false,
      message: 'Server is still initializing, please try again in a moment',
    });
  }

  console.log('[SERVER] AppFactory inicializado, processando requisição...');
  return appFactory.createTopDonorRoutes()(req, res, next);
});

// Rotas do padrão Composite (hierarquias de organizações)
app.use('/api/organizations', (req, res, next) => {
  if (!appFactory || !appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: 'Server is still initializing, please try again in a moment',
    });
  }

  // Importar rotas do Composite dinamicamente
  const organizationCompositeRoutes = require('./routes/organizationCompositeRoutes');
  return organizationCompositeRoutes(req, res, next);
});

// Health check endpoint

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Verifica saúde do sistema
 *     description: Endpoint para verificar se o servidor está funcionando corretamente
 *     responses:
 *       200:
 *         description: Sistema funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp da verificação
 *                 factory:
 *                   type: object
 *                   description: Estado do factory principal
 *                 deduplication:
 *                   type: object
 *                   description: Estatísticas de deduplicação
 *                 observers:
 *                   type: object
 *                   description: Estado do sistema de observers
 */
app.get('/health', (req, res) => {
  const healthData = {
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    factory: appFactory ? appFactory.getFactoryState() : { initialized: false },
    deduplication: getDeduplicationStats(),
  };

  // Add observer system status if available
  if (eventManager) {
    const stats = eventManager.getEventStats();
    healthData.observers = {
      totalObservers: eventManager.getObservers().length,
      totalEvents: stats.totalEvents,
      recentEvents: stats.recentEvents.length,
    };
  }

  res.status(200).json(healthData);
});

// Error handling
app.on('error', (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// CHAIN OF RESPONSIBILITY: Final handlers da cadeia
// Handler para rotas não encontradas (404) - deve vir antes do error handler
app.use(notFoundHandler);

// Global error handling middleware - último elo da cadeia
app.use(errorHandler);

app.listen(port, () => {
  console.log(` Server rodando na porta ${port}`);
  console.log(` Swagger UI dispon vel em: http://localhost:${port}/api-docs`);
  console.log(`  Documenta o alternativa em: http://localhost:${port}/docs`);
  console.log(`  Swagger JSON em: http://localhost:${port}/api-docs.json`);
  console.log(`  Health check em: http://localhost:${port}/health`);
});
