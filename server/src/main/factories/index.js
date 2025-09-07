const MongoUserRepository = require("../../infra/repositories/MongoUserRepository");
const MongoProductRepository = require("../../infra/repositories/MongoProductRepository");
const EnhancedJwtAuthService = require("../../infra/services/EnhancedJwtAuthService");
const ProductService = require("../../domain/services/ProductService");
const createAuthRoutes = require("../../presentation/routes/authRoutes");
const createProductRoutes = require("../../presentation/routes/productRoutes");
const bcrypt = require("bcrypt");

class AppFactory {
  constructor() {
    this.userRepository = null;
    this.productRepository = null;
    this.authService = null;
    this.productService = null;
  }

  createUserRepository() {
    if (!this.userRepository) {
      this.userRepository = new MongoUserRepository();
    }
    return this.userRepository;
  }

  createProductRepository() {
    if (!this.productRepository) {
      this.productRepository = new MongoProductRepository();
    }
    return this.productRepository;
  }

  createAuthService() {
    if (!this.authService) {
      const userRepository = this.createUserRepository();
      const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
      this.authService = new EnhancedJwtAuthService(userRepository, jwtSecret, jwtRefreshSecret);
    }
    return this.authService;
  }

  createProductService() {
    if (!this.productService) {
      const productRepository = this.createProductRepository();
      const userRepository = this.createUserRepository();
      this.productService = new ProductService(
        productRepository,
        userRepository
      );
    }
    return this.productService;
  }

  createAuthRoutes() {
    const authService = this.createAuthService();
    return createAuthRoutes(authService);
  }

  createProductRoutes() {
    const productService = this.createProductService();
    const authService = this.createAuthService();
    return createProductRoutes(productService, authService);
  }

  async comparePassword(password, hashedPassword) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      throw new Error("Login failed: Invalid credentials");
    }
  }

  async jwtLogin(user, password) {
    console.log("[JWT LOGIN] User found:", user);
    console.log("[JWT LOGIN] Comparing password:", password, "with hash:", user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("[JWT LOGIN] Password match result:", isMatch);
    if (!isMatch) {
      throw new Error("Login failed: Invalid credentials");
    }
  }
}

module.exports = AppFactory;
