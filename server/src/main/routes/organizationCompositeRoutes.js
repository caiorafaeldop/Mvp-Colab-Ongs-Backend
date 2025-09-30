/**
 * Organization Composite Routes - Rotas para hierarquias de organizações
 *
 * Define endpoints HTTP para operações com o padrão Composite.
 * Permite gerenciar estruturas hierárquicas de organizações através de APIs REST.
 */

const express = require('express');
const {
  validateBody,
  validateParams,
} = require('../../presentation/middleware/validationMiddleware');
const { authenticateToken } = require('../../presentation/middleware/AuthMiddleware');

// Importações dos factories
const RepositoryFactory = require('../factories/RepositoryFactory');
const OrganizationCompositeService = require('../../application/services/OrganizationCompositeService');
const OrganizationCompositeController = require('../../presentation/controllers/OrganizationCompositeController');

const router = express.Router();

// Inicializar dependências
const organizationRepository = RepositoryFactory.createOrganizationRepository();
const productRepository = RepositoryFactory.createProductRepository();
const donationRepository = RepositoryFactory.createDonationRepository();

const organizationCompositeService = new OrganizationCompositeService(
  organizationRepository,
  productRepository,
  donationRepository
);

const organizationCompositeController = new OrganizationCompositeController(
  organizationCompositeService
);

// Schemas de validação usando Zod
const { z } = require('zod');

const organizationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  type: z.enum(['independent', 'matrix', 'branch']).optional(),
  parentId: z.string().optional(),
});

const idSchema = z.object({
  id: z.string().min(1),
});

const childSchema = z.object({
  childId: z.string().min(1),
});

const pathParamsSchema = z.object({
  parentId: z.string().min(1),
  childId: z.string().min(1),
});

const searchParamsSchema = z.object({
  treeRootId: z.string().min(1),
  targetId: z.string().min(1),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     OrganizationComposite:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Nome da organização
 *         email:
 *           type: string
 *           format: email
 *           description: Email da organização
 *         type:
 *           type: string
 *           enum: [independent, matrix, branch]
 *           default: independent
 *           description: Tipo da organização
 *         parentId:
 *           type: string
 *           format: objectId
 *           description: ID da organização pai (para filiais)
 *
 *     OrganizationTree:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         isComposite:
 *           type: boolean
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrganizationTree'
 */

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Cria nova organização
 *     tags: [Organization Composite]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrganizationComposite'
 *     responses:
 *       201:
 *         description: Organização criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido
 */
router.post('/', authenticateToken, validateBody(organizationSchema), (req, res) =>
  organizationCompositeController.createOrganization(req, res)
);

/**
 * @swagger
 * /api/organizations/{id}/tree:
 *   get:
 *     summary: Busca árvore completa da organização
 *     tags: [Organization Composite]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização raiz
 *     responses:
 *       200:
 *         description: Árvore recuperada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tree:
 *                       $ref: '#/components/schemas/OrganizationTree'
 *                     display:
 *                       type: string
 *                     totalOrganizations:
 *                       type: number
 *       404:
 *         description: Organização não encontrada
 */
router.get('/:id/tree', validateParams(idSchema), (req, res) =>
  organizationCompositeController.getOrganizationTree(req, res)
);

/**
 * @swagger
 * /api/organizations/{id}/metrics:
 *   get:
 *     summary: Calcula métricas agregadas da organização
 *     tags: [Organization Composite]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização
 *     responses:
 *       200:
 *         description: Métricas calculadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: number
 *                     totalDonations:
 *                       type: number
 *                     totalOrganizations:
 *                       type: number
 *                     metrics:
 *                       type: object
 *       404:
 *         description: Organização não encontrada
 */
router.get('/:id/metrics', validateParams(idSchema), (req, res) =>
  organizationCompositeController.getOrganizationMetrics(req, res)
);

/**
 * @swagger
 * /api/organizations/{parentId}/children:
 *   post:
 *     summary: Adiciona organização como filial
 *     tags: [Organization Composite]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização pai
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *             properties:
 *               childId:
 *                 type: string
 *                 description: ID da organização filha
 *     responses:
 *       200:
 *         description: Filial adicionada com sucesso
 *       400:
 *         description: Dados inválidos ou operação inválida
 *       404:
 *         description: Organização não encontrada
 */
router.post(
  '/:parentId/children',
  authenticateToken,
  validateParams(z.object({ parentId: z.string().min(1) })),
  validateBody(childSchema),
  (req, res) => organizationCompositeController.addChildOrganization(req, res)
);

/**
 * @swagger
 * /api/organizations/{parentId}/children/{childId}:
 *   delete:
 *     summary: Remove organização filial
 *     tags: [Organization Composite]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização pai
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização filha
 *     responses:
 *       200:
 *         description: Filial removida com sucesso
 *       400:
 *         description: Operação inválida
 *       404:
 *         description: Organização não encontrada
 */
router.delete(
  '/:parentId/children/:childId',
  authenticateToken,
  validateParams(pathParamsSchema),
  (req, res) => organizationCompositeController.removeChildOrganization(req, res)
);

/**
 * @swagger
 * /api/organizations/matrices:
 *   get:
 *     summary: Lista todas as organizações matrizes
 *     tags: [Organization Composite]
 *     responses:
 *       200:
 *         description: Lista de organizações matrizes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrganizationTree'
 *                 total:
 *                   type: number
 */
router.get('/matrices', (req, res) =>
  organizationCompositeController.getAllMatrixOrganizations(req, res)
);

/**
 * @swagger
 * /api/organizations/{treeRootId}/search/{targetId}:
 *   get:
 *     summary: Busca organização específica na árvore
 *     tags: [Organization Composite]
 *     parameters:
 *       - in: path
 *         name: treeRootId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da raiz da árvore
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização procurada
 *     responses:
 *       200:
 *         description: Organização encontrada
 *       404:
 *         description: Organização não encontrada na árvore
 */
router.get('/:treeRootId/search/:targetId', validateParams(searchParamsSchema), (req, res) =>
  organizationCompositeController.findOrganizationInTree(req, res)
);

/**
 * @swagger
 * /api/organizations/{id}/display:
 *   get:
 *     summary: Exibe estrutura da árvore em formato texto
 *     tags: [Organization Composite]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da organização raiz
 *     responses:
 *       200:
 *         description: Estrutura em formato texto
 *       404:
 *         description: Organização não encontrada
 */
router.get('/:id/display', validateParams(idSchema), (req, res) =>
  organizationCompositeController.displayOrganizationTree(req, res)
);

/**
 * @swagger
 * /api/organizations/health:
 *   get:
 *     summary: Health check do sistema composite
 *     tags: [Organization Composite]
 *     responses:
 *       200:
 *         description: Sistema funcionando
 *       503:
 *         description: Sistema indisponível
 */
router.get('/health', (req, res) => organizationCompositeController.healthCheck(req, res));

module.exports = router;
