// Load environment variables
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database");
const AppFactory = require("./src/main/factories");
const uploadRouter = require("./src/presentation/routes/UploadRoutes");

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection
connectDB();

// Create factory and routes
const appFactory = new AppFactory();

// Routes
app.use("/api/auth", appFactory.createAuthRoutes());
app.use("/api", appFactory.createProductRoutes());
app.use("/api/upload", uploadRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
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
  console.log(`Server rodando na porta ${port}`);
});
