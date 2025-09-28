const express = require("express");
const AuthController = require("../controllers/AuthController");
const { authMiddleware } = require("../middleware/AuthMiddleware");

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
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
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - userType
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
 *           description: Senha do usuário
 *           example: "minhasenha123"
 *         userType:
 *           type: string
 *           enum: [common, organization]
 *           description: Tipo de usuário
 *           example: "common"
 *         phone:
 *           type: string
 *           description: Telefone de contato
 *           example: "11999999999"
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Login realizado com sucesso"
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *               description: Token JWT de acesso
 *             expiresIn:
 *               type: string
 *               description: Tempo de expiração do token
 *               example: "15m"
 */

// Cache para evitar recriação do controller
let cachedAuthController = null;
let cachedAuthService = null;

const createAuthRoutes = (authService) => {
  const router = express.Router();
  
  // Reutilizar controller se o service for o mesmo
  if (!cachedAuthController || cachedAuthService !== authService) {
    cachedAuthController = new AuthController(authService);
    cachedAuthService = authService;
    console.log('[AUTH ROUTES] AuthController criado/reutilizado');
  }

  // Public routes
  
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Registra um novo usuário
   *     description: Cria uma nova conta de usuário (pessoa física ou organização)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: Usuário registrado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       400:
   *         description: Dados inválidos ou email já existe
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Erro interno do servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/register", cachedAuthController.register);

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Realiza login do usuário
   *     description: Autentica usuário e retorna tokens de acesso
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *         headers:
   *           Set-Cookie:
   *             description: Refresh token em cookie httpOnly
   *             schema:
   *               type: string
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Credenciais inválidas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Erro interno do servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/login", cachedAuthController.login);

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Renova token de acesso
   *     description: Gera novo access token usando refresh token
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Token renovado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       description: Novo token de acesso
   *                     expiresIn:
   *                       type: string
   *                       example: "15m"
   *       401:
   *         description: Refresh token inválido ou expirado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/refresh", cachedAuthController.refreshToken);

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags: [Auth]
   *     summary: Realiza logout do usuário
   *     description: Invalida tokens e limpa cookies
   *     security:
   *       - cookieAuth: []
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
   *                   example: "Logout realizado com sucesso"
   */
  router.post("/logout", cachedAuthController.logout);

  // CHAIN OF RESPONSIBILITY PATTERN: Rota protegida com cadeia de middlewares
  // authMiddleware -> cachedAuthController.getProfile
  
  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     tags: [Auth]
   *     summary: Obtém perfil do usuário autenticado
   *     description: Retorna informações do usuário logado
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
  router.get(
    "/profile",
    authMiddleware(authService), // CHAIN HANDLER 1: Validação de token
    cachedAuthController.getProfile // CHAIN HANDLER 2: Processamento final
  );

  return router;
};

module.exports = createAuthRoutes;
