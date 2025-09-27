// Load environment variables
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const { connectDB } = require("./config/database");
const AppFactory = require("./factories");
const { deduplicationMiddleware, getDeduplicationStats } = require("../presentation/middleware/RequestDeduplicationMiddleware");
// const uploadRouter = require("../presentation/routes/UploadRoutes"); // Temporariamente comentado

const app = express();
const port = process.env.PORT || 3000;

// Pretty-print JSON responses
app.enable("json spaces");
// We want to be consistent with URL paths, so we enable strict routing
app.enable("strict routing");

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://rede-feminina-colab.onrender.com', // Frontend em produção
      'https://mvp-colab-ongs-backend.onrender.com' // Backend em produção
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('[CORS] Origin não permitida:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
};

// CHAIN OF RESPONSIBILITY PATTERN: Cadeia de middlewares globais
// Cada middleware processa a requisição e passa para o próximo via next()
app.use(cors(corsOptions)); // CHAIN HANDLER 1: CORS
app.use(cookieParser(process.env.COOKIE_SECRET)); // CHAIN HANDLER 2: Cookies
app.use(express.json()); // CHAIN HANDLER 3: JSON parsing
app.use(express.urlencoded({ extended: true })); // CHAIN HANDLER 4: URL encoding
app.use(express.static('public')); // CHAIN HANDLER 5: Static files

// CHAIN HANDLER 6: Middleware de deduplicação de requisições
app.use(deduplicationMiddleware);

// SWAGGER DOCUMENTATION SETUP
// Configuração do Swagger UI com tema personalizado
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 5px; }
  `,
  customSiteTitle: "Colab ONGs API Documentation",
  customfavIcon: "/favicon.ico",
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
    
    // Initialize Observer system
    if (!eventManager) {
      eventManager = await appFactory.createEventManager();
      
      // Emit system startup event
      await eventManager.emit('system.startup', {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        startTime: new Date(),
        factoryState: appFactory.getFactoryState()
      });
    }
    
    console.log('[Server] Sistema completo inicializado com sucesso');
    console.log('[Server] Estado do Factory:', JSON.stringify(appFactory.getFactoryState(), null, 2));
    
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
app.use("/api/auth", (req, res, next) => {
  if (!appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: "Server is still initializing, please try again in a moment"
    });
  }
  return appFactory.createSimpleAuthRoutes()(req, res, next);
});

// Sistema antigo (mantido para compatibilidade)
app.use("/api/auth-legacy", (req, res, next) => {
  if (!appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: "Server is still initializing, please try again in a moment"
    });
  }
  return appFactory.createAuthRoutes()(req, res, next);
});

app.use("/api", (req, res, next) => {
  if (!appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: "Server is still initializing, please try again in a moment"
    });
  }
  return appFactory.createProductRoutes()(req, res, next);
});

// CHAIN OF RESPONSIBILITY PATTERN: Rota de upload integrada ao sistema de factories
app.use("/api/upload", (req, res, next) => {
  if (!appFactory || !appFactory.initialized) {
    return res.status(503).json({
      success: false,
      message: "Server is still initializing, please try again in a moment"
    });
  }
  return appFactory.createUploadRoutes()(req, res, next);
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
app.get("/health", (req, res) => {
  const healthData = {
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    factory: appFactory ? appFactory.getFactoryState() : { initialized: false },
    deduplication: getDeduplicationStats()
  };

  // Add observer system status if available
  if (eventManager) {
    const stats = eventManager.getEventStats();
    healthData.observers = {
      totalObservers: eventManager.getObservers().length,
      totalEvents: stats.totalEvents,
      recentEvents: stats.recentEvents.length
    };
  }

  res.status(200).json(healthData);
});

// Error handling
app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});


// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`🚀 Server rodando na porta ${port}`);
  console.log(`📚 Swagger UI disponível em: http://localhost:${port}/api-docs`);
  console.log(`📖 Documentação alternativa em: http://localhost:${port}/docs`);
  console.log(`📄 Swagger JSON em: http://localhost:${port}/api-docs.json`);
  console.log(`🏥 Health check em: http://localhost:${port}/health`);
});
