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
app.use(cors({
  origin: true, // Allow all origins for development - configure properly for production
  credentials: true // Allow cookies to be sent
}));
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
