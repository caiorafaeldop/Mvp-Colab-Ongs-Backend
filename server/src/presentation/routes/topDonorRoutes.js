const express = require('express');
const TopDonorController = require('../controllers/TopDonorController');
const { authMiddleware } = require('../middleware/AuthMiddleware');
const { adminMiddleware } = require('../middleware/AdminMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     TopDonor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do doador de destaque
 *           example: "507f1f77bcf86cd799439011"
 *         donorName:
 *           type: string
 *           description: Nome do doador
 *           example: "Maria Santos"
 *         topPosition:
 *           type: integer
 *           description: Posição no ranking
 *           example: 1
 *         donatedAmount:
 *           type: number
 *           format: float
 *           description: Valor total doado
 *           example: 10000.00
 *         donationType:
 *           type: string
 *           enum: [single, recurring, total]
 *           description: Tipo de doação
 *           example: "total"
 *         donationDate:
 *           type: string
 *           format: date-time
 *           description: Data da doação
 *           example: "2025-10-10T00:00:00Z"
 *         organizationId:
 *           type: string
 *           description: ID da organização beneficiada (opcional)
 *           example: "507f1f77bcf86cd799439012"
 *         organizationName:
 *           type: string
 *           description: Nome da organização (opcional)
 *           example: "ONG Esperança"
 *         referenceMonth:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           description: Mês de referência
 *           example: 10
 *         referenceYear:
 *           type: integer
 *           description: Ano de referência
 *           example: 2025
 *         metadata:
 *           type: object
 *           description: Metadados adicionais
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     TopDonorCreate:
 *       type: object
 *       required:
 *         - donorName
 *         - donatedAmount
 *         - donationType
 *         - donationDate
 *         - referenceMonth
 *         - referenceYear
 *       properties:
 *         donorName:
 *           type: string
 *           description: Nome do doador
 *           example: "Maria Santos"
 *         topPosition:
 *           type: integer
 *           minimum: 1
 *           description: Opcional. Será recalculada automaticamente pelo sistema com base no valor doado.
 *           example: 1
 *         donatedAmount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: Valor total doado
 *           example: 10000.00
 *         donationType:
 *           type: string
 *           enum: [single, recurring, total]
 *           description: Tipo de doação
 *           example: "total"
 *         donationDate:
 *           type: string
 *           format: date-time
 *           description: Data da doação
 *           example: "2025-10-10T00:00:00.000Z"
 *         organizationId:
 *           type: string
 *           description: ID da organização beneficiada (opcional)
 *           example: "507f1f77bcf86cd799439012"
 *         organizationName:
 *           type: string
 *           description: Nome da organização (opcional)
 *           example: "ONG Esperança"
 *         referenceMonth:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           description: Mês de referência
 *           example: 10
 *         referenceYear:
 *           type: integer
 *           minimum: 2000
 *           description: Ano de referência
 *           example: 2025
 *         metadata:
 *           type: object
 *           description: Metadados adicionais
 *
 *     TopDonorUpdate:
 *       type: object
 *       properties:
 *         donorName:
 *           type: string
 *           example: "Maria Santos Jr."
 *         topPosition:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         donatedAmount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           example: 12000.00
 *         donationType:
 *           type: string
 *           enum: [single, recurring, total]
 *         donationDate:
 *           type: string
 *           format: date-time
 *         organizationId:
 *           type: string
 *         organizationName:
 *           type: string
 *         referenceMonth:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         referenceYear:
 *           type: integer
 *           minimum: 2000
 *         metadata:
 *           type: object
 *
 * tags:
 *   name: TopDonors
 *   description: Gerenciamento de doadores de destaque (Admin apenas)
 */

/**
 * Cria as rotas para gerenciar doadores de destaque
 * Todas as rotas exigem autenticação + permissão de admin
 */
function createTopDonorRoutes(topDonorController) {
  const router = express.Router();

  /**
   * @swagger
   * /api/top-donors:
   *   post:
   *     tags: [TopDonors]
   *     summary: Cria um novo doador de destaque
   *     description: Cria um novo registro de doador de destaque. Requer permissões de admin.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TopDonorCreate'
   *     responses:
   *       201:
   *         description: Doador de destaque criado com sucesso
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
   *                   example: "Doador de destaque criado com sucesso"
   *                 data:
   *                   $ref: '#/components/schemas/TopDonor'
   *       400:
   *         description: Erro de validação
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Acesso negado - requer privilégios de admin
   */
  router.post('/', topDonorController.create);

  /**
   * @swagger
   * /api/top-donors:
   *   get:
   *     tags: [TopDonors]
   *     summary: Lista todos os doadores de destaque
   *     description: Retorna lista paginada de doadores de destaque com filtros opcionais
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número da página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Itens por página
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *         description: Filtrar por ano de referência
   *         example: 2025
   *       - in: query
   *         name: month
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 12
   *         description: Filtrar por mês de referência
   *         example: 10
   *       - in: query
   *         name: organizationId
   *         schema:
   *           type: string
   *         description: Filtrar por organização
   *       - in: query
   *         name: donationType
   *         schema:
   *           type: string
   *           enum: [single, recurring, total]
   *         description: Filtrar por tipo de doação
   *     responses:
   *       200:
   *         description: Lista de doadores de destaque
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/TopDonor'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     pages:
   *                       type: integer
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Acesso negado - requer privilégios de admin
   */
  router.get('/', topDonorController.getAll);

  /**
   * @swagger
   * /api/top-donors/period/{year}/{month}:
   *   get:
   *     tags: [TopDonors]
   *     summary: Busca doadores de um período específico
   *     description: Retorna todos os doadores de destaque de um mês/ano específico
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: year
   *         required: true
   *         schema:
   *           type: integer
   *         description: Ano de referência
   *         example: 2025
   *       - in: path
   *         name: month
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 12
   *         description: Mês de referência (1-12)
   *         example: 10
   *     responses:
   *       200:
   *         description: Lista de doadores do período
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/TopDonor'
   *       400:
   *         description: Parâmetros inválidos
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Acesso negado
   */
  router.get('/period/:year/:month', topDonorController.getByPeriod);

  /**
   * @swagger
   * /api/top-donors/organization/{organizationId}:
   *   get:
   *     tags: [TopDonors]
   *     summary: Busca doadores de uma organização
   *     description: Retorna todos os doadores de destaque de uma organização específica
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da organização
   *         example: "507f1f77bcf86cd799439012"
   *     responses:
   *       200:
   *         description: Lista de doadores da organização
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/TopDonor'
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Acesso negado
   */
  router.get('/organization/:organizationId', topDonorController.getByOrganization);

  /**
   * @swagger
   * /api/top-donors/top/{year}/{month}/{limit}:
   *   get:
   *     tags: [TopDonors]
   *     summary: Busca o top N doadores de um período
   *     description: Retorna os N primeiros doadores de destaque de um período
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: year
   *         required: true
   *         schema:
   *           type: integer
   *         description: Ano de referência
   *         example: 2025
   *       - in: path
   *         name: month
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 12
   *         description: Mês de referência
   *         example: 10
   *       - in: path
   *         name: limit
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Quantidade de doadores a retornar
   *         example: 10
   *     responses:
   *       200:
   *         description: Top N doadores
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/TopDonor'
   *       400:
   *         description: Parâmetros inválidos
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Acesso negado
   */
  router.get('/top/:year/:month/:limit', topDonorController.getTopN);

  /**
   * @swagger
   * /api/top-donors/{id}:
   *   get:
   *     tags: [TopDonors]
   *     summary: Busca um doador de destaque por ID
   *     description: Retorna os detalhes de um doador de destaque específico
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do doador de destaque
   *         example: "507f1f77bcf86cd799439011"
   *     responses:
   *       200:
   *         description: Doador de destaque encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/TopDonor'
   *       404:
   *         description: Doador não encontrado
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Acesso negado
   */
  router.get('/:id', topDonorController.getById);

  /**
   * @swagger
   * /api/top-donors/{id}:
   *   put:
   *     tags: [TopDonors]
   *     summary: Atualiza um doador de destaque
   *     description: Atualiza os dados de um doador de destaque existente
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do doador de destaque
   *         example: "507f1f77bcf86cd799439011"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TopDonorUpdate'
   *     responses:
   *       200:
   *         description: Doador atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/TopDonor'
   *       400:
   *         description: Erro de validação
   *       404:
   *         description: Doador não encontrado
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Acesso negado
   */
  router.put('/:id', topDonorController.update);

  /**
   * @swagger
   * /api/top-donors/{id}:
   *   delete:
   *     tags: [TopDonors]
   *     summary: Deleta um doador de destaque
   *     description: Remove um doador de destaque do sistema
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do doador de destaque
   *         example: "507f1f77bcf86cd799439011"
   *     responses:
   *       200:
   *         description: Doador deletado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       404:
   *         description: Doador não encontrado
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Acesso negado
   */
  router.delete('/:id', topDonorController.delete);

  /**
   * @swagger
   * /api/top-donors/period/{year}/{month}:
   *   delete:
   *     tags: [TopDonors]
   *     summary: Deleta todos os doadores de um período
   *     description: Remove todos os doadores de destaque de um mês/ano específico
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: year
   *         required: true
   *         schema:
   *           type: integer
   *         description: Ano de referência
   *         example: 2025
   *       - in: path
   *         name: month
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 12
   *         description: Mês de referência (1-12)
   *         example: 10
   *     responses:
   *       200:
   *         description: Doadores deletados com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 count:
   *                   type: integer
   *                   description: Quantidade de doadores deletados
   *       400:
   *         description: Parâmetros inválidos
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Acesso negado
   */
  router.delete('/period/:year/:month', topDonorController.deleteByPeriod);

  return router;
}

/**
 * Factory para criar e configurar as rotas com autenticação
 */
function createAuthenticatedTopDonorRoutes(authService, topDonorController) {
  console.log('[TOP DONOR ROUTES] Criando rotas autenticadas...');
  console.log('[TOP DONOR ROUTES] authService:', !!authService);
  console.log('[TOP DONOR ROUTES] topDonorController:', !!topDonorController);

  const router = express.Router();

  // Aplica autenticação + permissão de admin em todas as rotas
  console.log('[TOP DONOR ROUTES] Aplicando middlewares de autenticação e admin');
  router.use(authMiddleware(authService), adminMiddleware());

  // Adiciona as rotas do CRUD
  console.log('[TOP DONOR ROUTES] Adicionando rotas do CRUD');
  const topDonorRoutes = createTopDonorRoutes(topDonorController);
  router.use('/', topDonorRoutes);

  console.log('[TOP DONOR ROUTES] Rotas criadas com sucesso');
  return router;
}

module.exports = {
  createTopDonorRoutes,
  createAuthenticatedTopDonorRoutes,
  // Cria rotas públicas somente-leitura para consumo pelo frontend
  createPublicTopDonorRoutes: function (topDonorController) {
    const router = express.Router();
    // Expor apenas consultas públicas
    router.get('/top/:year/:month/:limit', topDonorController.getTopN);
    router.get('/period/:year/:month', topDonorController.getByPeriod);
    return router;
  },
};
