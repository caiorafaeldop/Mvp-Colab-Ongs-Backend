const express = require('express');
const EnhancedAuthController = require('../controllers/EnhancedAuthController');
const { CreateUserDTO, LoginDTO } = require('../../application/dtos');
const { validateDTO } = require('../middleware/validationMiddleware');
const { authLimiter, generalLimiter } = require('../middleware/rateLimiter');
const { requestLoggingMiddleware } = require('../../infra/logger');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Rotas de autenticação usando todas as melhorias implementadas:
 * - Rate Limiting
 * - Validação com DTOs
 * - Logging automático
 * - Use Cases
 */
function createEnhancedAuthRoutes(userRepository, authService) {
  const router = express.Router();
  const authController = new EnhancedAuthController(userRepository, authService);

  // Aplicar logging automático em todas as rotas
  router.use(requestLoggingMiddleware);

  /**
   * @swagger
   * /api/v2/auth/register:
   *   post:
   *     summary: Registra um novo usuário (versão melhorada)
   *     tags: [Auth V2]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 100
   *                 example: "João Silva"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "joao@example.com"
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: "MinhaSenh@123"
   *               phone:
   *                 type: string
   *                 pattern: "^\\(\\d{2}\\)\\s\\d{4,5}-\\d{4}$"
   *                 example: "(11) 99999-9999"
   *               organizationType:
   *                 type: string
   *                 enum: [ong, empresa, pessoa_fisica]
   *                 example: "ong"
   *               description:
   *                 type: string
   *                 maxLength: 500
   *                 example: "ONG focada em educação"
   *     responses:
   *       201:
   *         description: Usuário registrado com sucesso
   *       400:
   *         description: Dados inválidos
   *       409:
   *         description: Email já existe
   *       429:
   *         description: Muitas tentativas
   */
  router.post('/register', 
    authLimiter, // Rate limiting específico para auth
    validateDTO(CreateUserDTO), // Validação com DTO
    authController.register
  );

  /**
   * @swagger
   * /api/v2/auth/login:
   *   post:
   *     summary: Autentica um usuário (versão melhorada)
   *     tags: [Auth V2]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "joao@example.com"
   *               password:
   *                 type: string
   *                 example: "MinhaSenh@123"
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *         headers:
   *           Set-Cookie:
   *             description: Refresh token httpOnly
   *             schema:
   *               type: string
   *       401:
   *         description: Credenciais inválidas
   *       403:
   *         description: Conta desativada
   *       429:
   *         description: Muitas tentativas de login
   */
  router.post('/login',
    authLimiter, // Rate limiting mais restritivo para login
    validateDTO(LoginDTO), // Validação com DTO
    authController.login
  );

  /**
   * @swagger
   * /api/v2/auth/logout:
   *   post:
   *     summary: Realiza logout do usuário
   *     tags: [Auth V2]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Logout realizado com sucesso
   *       500:
   *         description: Erro interno
   */
  router.post('/logout',
    generalLimiter, // Rate limiting geral
    authController.logout // Não precisa de auth middleware (pode fazer logout sem estar logado)
  );

  /**
   * @swagger
   * /api/v2/auth/refresh:
   *   post:
   *     summary: Renova o token de acesso
   *     tags: [Auth V2]
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Token renovado com sucesso
   *       401:
   *         description: Refresh token inválido ou ausente
   */
  router.post('/refresh',
    generalLimiter, // Rate limiting geral
    authController.refreshToken
  );

  /**
   * @swagger
   * /api/v2/auth/profile:
   *   get:
   *     summary: Obtém perfil do usuário autenticado
   *     tags: [Auth V2]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Perfil obtido com sucesso
   *       401:
   *         description: Token inválido
   *       404:
   *         description: Usuário não encontrado
   */
  router.get('/profile',
    generalLimiter, // Rate limiting geral
    authMiddleware, // Middleware de autenticação
    authController.getProfile
  );

  /**
   * @swagger
   * /api/v2/auth/info:
   *   get:
   *     summary: Informações sobre o controller de autenticação
   *     tags: [Auth V2]
   *     responses:
   *       200:
   *         description: Informações do controller
   */
  router.get('/info',
    generalLimiter,
    (req, res) => {
      const info = authController.getControllerInfo();
      res.json({
        success: true,
        data: info,
        message: 'Informações do controller obtidas'
      });
    }
  );

  return router;
}

module.exports = createEnhancedAuthRoutes;
