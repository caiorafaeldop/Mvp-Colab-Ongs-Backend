const express = require('express');
const { authMiddleware } = require('../middleware/AuthMiddleware');
const { adminMiddleware } = require('../middleware/AdminMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Supporter:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do apoiador
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Nome do apoiador/colaborador
 *           example: "Empresa XYZ"
 *         imageUrl:
 *           type: string
 *           description: URL da imagem/logo do apoiador
 *           example: "https://example.com/logo.png"
 *         description:
 *           type: string
 *           description: Descrição do apoiador
 *           example: "Empresa parceira que apoia nossas causas"
 *         website:
 *           type: string
 *           description: Website do apoiador
 *           example: "https://example.com"
 *         order:
 *           type: integer
 *           description: Ordem de exibição
 *           example: 1
 *         visible:
 *           type: boolean
 *           description: Se o apoiador está visível publicamente
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     SupporterCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do apoiador/colaborador
 *           example: "Empresa XYZ"
 *         imageUrl:
 *           type: string
 *           description: URL da imagem/logo do apoiador
 *           example: "https://example.com/logo.png"
 *         description:
 *           type: string
 *           description: Descrição do apoiador
 *           example: "Empresa parceira que apoia nossas causas"
 *         website:
 *           type: string
 *           description: Website do apoiador
 *           example: "https://example.com"
 *         order:
 *           type: integer
 *           description: Ordem de exibição
 *           default: 0
 *           example: 1
 *         visible:
 *           type: boolean
 *           description: Se o apoiador está visível publicamente
 *           default: true
 *           example: true
 *
 *     SupporterUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Empresa XYZ Atualizada"
 *         imageUrl:
 *           type: string
 *           example: "https://example.com/new-logo.png"
 *         description:
 *           type: string
 *         website:
 *           type: string
 *         order:
 *           type: integer
 *         visible:
 *           type: boolean
 *
 * tags:
 *   name: Supporters
 *   description: Gerenciamento de apoiadores/colaboradores exibidos na Home
 */

/**
 * @swagger
 * /api/supporters:
 *   get:
 *     tags: [Supporters]
 *     summary: Lista todos os apoiadores (Admin)
 *     description: Retorna lista paginada de apoiadores com filtros opcionais. Requer autenticação de admin.
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome
 *       - in: query
 *         name: visible
 *         schema:
 *           type: boolean
 *         description: Filtrar por visibilidade
 *     responses:
 *       200:
 *         description: Lista de apoiadores
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
 *                     $ref: '#/components/schemas/Supporter'
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
 *   post:
 *     tags: [Supporters]
 *     summary: Cria um novo apoiador
 *     description: Cria um novo apoiador/colaborador. Requer autenticação de admin.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupporterCreate'
 *     responses:
 *       201:
 *         description: Apoiador criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Supporter'
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado
 */

/**
 * @swagger
 * /api/supporters/{id}:
 *   patch:
 *     tags: [Supporters]
 *     summary: Atualiza um apoiador
 *     description: Atualiza os dados de um apoiador existente. Requer autenticação de admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do apoiador
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupporterUpdate'
 *     responses:
 *       200:
 *         description: Apoiador atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Supporter'
 *       400:
 *         description: Erro de validação
 *       404:
 *         description: Apoiador não encontrado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado
 *   delete:
 *     tags: [Supporters]
 *     summary: Deleta um apoiador
 *     description: Remove um apoiador do sistema. Requer autenticação de admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do apoiador
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Apoiador deletado com sucesso
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
 *         description: Apoiador não encontrado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado
 */

function createSupporterRoutes(controller) {
  const router = express.Router();

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);

  return router;
}

function createAuthenticatedSupporterRoutes(authService, controller) {
  const router = express.Router();
  router.use(authMiddleware(authService), adminMiddleware());
  router.use('/', createSupporterRoutes(controller));
  return router;
}

/**
 * @swagger
 * /api/public/supporters:
 *   get:
 *     tags: [Supporters]
 *     summary: Lista apoiadores públicos
 *     description: Retorna lista de apoiadores visíveis publicamente (não requer autenticação)
 *     responses:
 *       200:
 *         description: Lista de apoiadores públicos
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
 *                     $ref: '#/components/schemas/Supporter'
 *       400:
 *         description: Erro ao buscar apoiadores
 */
function createPublicSupporterRoutes(controller) {
  const router = express.Router();
  router.get('/', controller.listPublic);
  return router;
}

module.exports = {
  createSupporterRoutes,
  createAuthenticatedSupporterRoutes,
  createPublicSupporterRoutes,
};
