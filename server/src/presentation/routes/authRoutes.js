const express = require("express");
const AuthController = require("../controllers/AuthController");
const { authMiddleware } = require("../middleware/AuthMiddleware");

const createAuthRoutes = (authService) => {
  const router = express.Router();
  const authController = new AuthController(authService);

  // Public routes
  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/refresh", authController.refreshToken);
  router.post("/logout", authController.logout);

  // Protected routes
  router.get(
    "/profile",
    authMiddleware(authService),
    authController.getProfile
  );

  return router;
};

module.exports = createAuthRoutes;
