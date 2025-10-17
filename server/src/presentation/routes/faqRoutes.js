const express = require('express');

/**
 * @swagger
 * components:
 *   schemas:
 *     FAQ:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         pergunta:
 *           type: string
 *           example: "Como faço para doar?"
 *         resposta:
 *           type: string
 *           example: "Você pode doar através do botão 'Doar Agora' na página inicial."
 *         ordem:
 *           type: integer
 *           example: 1
 *         ativo:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     FAQRequest:
 *       type: object
 *       required:
 *         - pergunta
 *         - resposta
 *       properties:
 *         pergunta:
 *           type: string
 *           example: "Como faço para doar?"
 *         resposta:
 *           type: string
 *           example: "Você pode doar através do botão 'Doar Agora' na página inicial."
 *         ordem:
 *           type: integer
 *           example: 1
 *         ativo:
 *           type: boolean
 *           example: true
 *
 * tags:
 *   name: FAQ
 *   description: 📋 Perguntas Frequentes
 */

/**
 * Cria rotas para FAQ
 */
function createFAQRoutes(faqService, authService) {
  const router = express.Router();
  const FAQController = require('../controllers/FAQController');
  const faqController = new FAQController(faqService);
  const { authMiddleware } = require('../middleware/AuthMiddleware');
  const { adminMiddleware } = require('../middleware/AdminMiddleware');

  /**
   * @swagger
   * /api/faqs:
   *   post:
   *     tags: [FAQ]
   *     summary: Cria uma nova pergunta (Admin)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FAQRequest'
   *     responses:
   *       201:
   *         description: FAQ criada com sucesso
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
   *                   $ref: '#/components/schemas/FAQ'
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Sem permissão
   */
  router.post('/', authMiddleware(authService), adminMiddleware(), faqController.create);

  /**
   * @swagger
   * /api/faqs:
   *   get:
   *     tags: [FAQ]
   *     summary: Lista todas as perguntas
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *       - in: query
   *         name: ativo
   *         schema:
   *           type: boolean
   *         description: Filtrar por status ativo
   *     responses:
   *       200:
   *         description: Lista de FAQs
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
   *                     $ref: '#/components/schemas/FAQ'
   *                 pagination:
   *                   type: object
   */
  router.get('/', faqController.getAll);

  /**
   * @swagger
   * /api/faqs/{id}:
   *   get:
   *     tags: [FAQ]
   *     summary: Busca FAQ por ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: FAQ encontrada
   *       404:
   *         description: FAQ não encontrada
   */
  router.get('/:id', faqController.getById);

  /**
   * @swagger
   * /api/faqs/{id}:
   *   put:
   *     tags: [FAQ]
   *     summary: Atualiza uma FAQ (Admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FAQRequest'
   *     responses:
   *       200:
   *         description: FAQ atualizada
   *       404:
   *         description: FAQ não encontrada
   */
  router.put('/:id', authMiddleware(authService), adminMiddleware(), faqController.update);

  /**
   * @swagger
   * /api/faqs/{id}:
   *   delete:
   *     tags: [FAQ]
   *     summary: Deleta uma FAQ (Admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: FAQ deletada
   *       404:
   *         description: FAQ não encontrada
   */
  router.delete('/:id', authMiddleware(authService), adminMiddleware(), faqController.delete);

  /**
   * @swagger
   * /api/faqs/{id}/toggle:
   *   patch:
   *     tags: [FAQ]
   *     summary: Ativa/Desativa uma FAQ (Admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Status alternado
   *       404:
   *         description: FAQ não encontrada
   */
  router.patch(
    '/:id/toggle',
    authMiddleware(authService),
    adminMiddleware(),
    faqController.toggleActive
  );

  return router;
}

module.exports = createFAQRoutes;
