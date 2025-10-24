const express = require('express');
const PrestacaoContasController = require('../controllers/PrestacaoContasController');
const { createSimpleAuthMiddleware } = require('../middleware/SimpleAuthMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     PrestacaoContas:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único da prestação de contas
 *         titulo:
 *           type: string
 *           description: Título da prestação de contas
 *         descricao:
 *           type: string
 *           description: Descrição detalhada
 *         orgaoDoador:
 *           type: string
 *           description: Nome do órgão/entidade doadora
 *         valor:
 *           type: number
 *           format: float
 *           description: Valor da prestação
 *         data:
 *           type: string
 *           format: date-time
 *           description: Data da prestação de contas
 *         categoria:
 *           type: string
 *           enum: [Despesa, Receita, Investimento]
 *           description: Categoria da prestação
 *         tipoDespesa:
 *           type: string
 *           description: Tipo de despesa (opcional)
 *         organizationId:
 *           type: string
 *           description: ID da organização
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PrestacaoContasRequest:
 *       type: object
 *       required:
 *         - titulo
 *         - descricao
 *         - orgaoDoador
 *         - valor
 *         - data
 *         - categoria
 *         - organizationId
 *       properties:
 *         titulo:
 *           type: string
 *           example: "Compra de alimentos"
 *         descricao:
 *           type: string
 *           example: "Compra de cestas básicas para distribuição"
 *         orgaoDoador:
 *           type: string
 *           example: "Prefeitura Municipal"
 *         valor:
 *           type: number
 *           format: float
 *           example: 5000.00
 *         data:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *         categoria:
 *           type: string
 *           enum: [Despesa, Receita, Investimento]
 *           example: "Despesa"
 *         tipoDespesa:
 *           type: string
 *           example: "Alimentação"
 *         organizationId:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 */

const createPrestacaoContasRoutes = (prestacaoContasService, authService) => {
  const router = express.Router();
  const prestacaoContasController = new PrestacaoContasController(prestacaoContasService);

  // Middleware de autenticação (opcional para algumas rotas)
  const auth = authService ? createSimpleAuthMiddleware(authService) : null;

  /**
   * @swagger
   * /api/prestacao-contas:
   *   post:
   *     tags: [Prestação de Contas]
   *     summary: Criar nova prestação de contas
   *     description: Cria uma nova prestação de contas para uma organização
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PrestacaoContasRequest'
   *     responses:
   *       201:
   *         description: Prestação de contas criada com sucesso
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
   *                   example: "Prestação de contas criada com sucesso"
   *                 data:
   *                   $ref: '#/components/schemas/PrestacaoContas'
   *       400:
   *         description: Dados inválidos
   */
  router.post('/', auth ? auth : (req, res, next) => next(), prestacaoContasController.create);

  /**
   * @swagger
   * /api/prestacao-contas:
   *   get:
   *     tags: [Prestação de Contas]
   *     summary: Listar todas as prestações de contas
   *     description: Lista todas as prestações de contas com filtros opcionais
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
   *         name: categoria
   *         schema:
   *           type: string
   *           enum: [Despesa, Receita, Investimento]
   *         description: Filtrar por categoria
   *       - in: query
   *         name: organizationId
   *         schema:
   *           type: string
   *         description: Filtrar por organização
   *     responses:
   *       200:
   *         description: Lista de prestações de contas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/PrestacaoContas'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   */
  router.get('/', prestacaoContasController.getAll);

  /**
   * @swagger
   * /api/prestacao-contas/{id}:
   *   get:
   *     tags: [Prestação de Contas]
   *     summary: Buscar prestação de contas por ID
   *     description: Retorna uma prestação de contas específica
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da prestação de contas
   *     responses:
   *       200:
   *         description: Prestação de contas encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/PrestacaoContas'
   *       404:
   *         description: Prestação de contas não encontrada
   */
  router.get('/:id', prestacaoContasController.getById);

  /**
   * @swagger
   * /api/prestacao-contas/organization/{organizationId}:
   *   get:
   *     tags: [Prestação de Contas]
   *     summary: Listar prestações de contas de uma organização
   *     description: Lista todas as prestações de contas de uma organização específica
   *     parameters:
   *       - in: path
   *         name: organizationId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da organização
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *       - in: query
   *         name: categoria
   *         schema:
   *           type: string
   *           enum: [Despesa, Receita, Investimento]
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data inicial
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data final
   *     responses:
   *       200:
   *         description: Lista de prestações de contas da organização
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/PrestacaoContas'
   */
  router.get('/organization/:organizationId', prestacaoContasController.getByOrganization);

  /**
   * @swagger
   * /api/prestacao-contas/categoria/{categoria}:
   *   get:
   *     tags: [Prestação de Contas]
   *     summary: Listar prestações de contas por categoria
   *     description: Lista todas as prestações de contas de uma categoria específica
   *     parameters:
   *       - in: path
   *         name: categoria
   *         required: true
   *         schema:
   *           type: string
   *           enum: [Despesa, Receita, Investimento]
   *         description: Categoria da prestação
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *       - in: query
   *         name: organizationId
   *         schema:
   *           type: string
   *         description: Filtrar por organização
   *     responses:
   *       200:
   *         description: Lista de prestações de contas por categoria
   */
  router.get('/categoria/:categoria', prestacaoContasController.getByCategory);

  /**
   * @swagger
   * /api/prestacao-contas/{id}:
   *   put:
   *     tags: [Prestação de Contas]
   *     summary: Atualizar prestação de contas
   *     description: Atualiza uma prestação de contas existente
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da prestação de contas
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               titulo:
   *                 type: string
   *               descricao:
   *                 type: string
   *               orgaoDoador:
   *                 type: string
   *               valor:
   *                 type: number
   *               data:
   *                 type: string
   *                 format: date-time
   *               categoria:
   *                 type: string
   *               tipoDespesa:
   *                 type: string
   *     responses:
   *       200:
   *         description: Prestação de contas atualizada com sucesso
   *       404:
   *         description: Prestação de contas não encontrada
   */
  router.put('/:id', auth ? auth : (req, res, next) => next(), prestacaoContasController.update);

  /**
   * @swagger
   * /api/prestacao-contas/{id}:
   *   delete:
   *     tags: [Prestação de Contas]
   *     summary: Deletar prestação de contas
   *     description: Remove uma prestação de contas do sistema
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da prestação de contas
   *     responses:
   *       200:
   *         description: Prestação de contas deletada com sucesso
   *       404:
   *         description: Prestação de contas não encontrada
   */
  router.delete('/:id', auth ? auth : (req, res, next) => next(), prestacaoContasController.delete);

  return router;
};

module.exports = createPrestacaoContasRoutes;
