const express = require("express");
const SimpleAuthController = require("../controllers/SimpleAuthController");
const { createSimpleAuthMiddleware } = require("../middleware/SimpleAuthMiddleware");

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: "JWT token obtido através do endpoint de login"
 *   
 *   schemas:
 *     SimpleLoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *           example: "usuario@exemplo.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Senha do usuário
 *           example: "minhasenha123"
 *     
 *     SimpleRegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do usuário ou organização
 *           example: "João Silva"
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *           example: "joao@exemplo.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Senha do usuário (mínimo 6 caracteres)
 *           example: "minhasenha123"
 *         userType:
 *           type: string
 *           enum: [common, organization]
 *           description: Tipo de usuário
 *           example: "common"
 *           default: "common"
 *         phone:
 *           type: string
 *           description: Telefone de contato (opcional)
 *           example: "11999999999"
 *     
 *     SimpleAuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Login successful"
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *               description: Token JWT de acesso (45 minutos)
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             refreshToken:
 *               type: string
 *               description: Token JWT de refresh (7 dias)
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Token de refresh obtido no login
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

// Cache para evitar recriação do controller
let cachedAuthController = null;
let cachedAuthService = null;

const createSimpleAuthRoutes = (authService) => {
  const router = express.Router();
  
  // Reutilizar controller se o service for o mesmo
  if (!cachedAuthController || cachedAuthService !== authService) {
    cachedAuthController = new SimpleAuthController(authService);
    cachedAuthService = authService;
    console.log('[SIMPLE AUTH ROUTES] SimpleAuthController criado/reutilizado');
  }

  // Middleware de autenticação
  const authMiddleware = createSimpleAuthMiddleware(authService);

  // Public routes
  
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Authentication]
   *     summary: Login de usuário
   *     description: Autentica usuário e retorna tokens JWT (access + refresh)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SimpleLoginRequest'
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SimpleAuthResponse'
   *       400:
   *         description: Email e senha são obrigatórios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Credenciais inválidas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/login", cachedAuthController.login);

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags: [Authentication]
   *     summary: Registro de usuário
   *     description: Cria nova conta de usuário (pessoa física ou organização)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SimpleRegisterRequest'
   *     responses:
   *       201:
   *         description: Usuário registrado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SimpleAuthResponse'
   *       400:
   *         description: Dados inválidos ou usuário já existe
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/register", cachedAuthController.register);

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     tags: [Authentication]
   *     summary: Renovar tokens
   *     description: Gera novos tokens usando refresh token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshTokenRequest'
   *     responses:
   *       200:
   *         description: Tokens renovados com sucesso
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
   *                   example: "Tokens refreshed successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       description: Novo token de acesso
   *                     refreshToken:
   *                       type: string
   *                       description: Novo token de refresh
   *       401:
   *         description: Refresh token inválido ou expirado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/refresh", cachedAuthController.refresh);

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags: [Authentication]
   *     summary: Logout de usuário
   *     description: Realiza logout (cliente deve descartar tokens)
   *     responses:
   *       200:
   *         description: Logout realizado com sucesso
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
   *                   example: "Logout successful"
   */
  router.post("/logout", cachedAuthController.logout);

  // Protected routes
  
  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     tags: [Authentication]
   *     summary: Obter perfil do usuário
   *     description: Retorna informações do usuário autenticado
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Perfil obtido com sucesso
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
   *                   example: "Profile retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *       401:
   *         description: Token inválido ou expirado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get("/profile", authMiddleware, cachedAuthController.getProfile);

  return router;
};

module.exports = createSimpleAuthRoutes;
