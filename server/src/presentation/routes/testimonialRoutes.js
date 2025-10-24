const express = require('express');

/**
 * @swagger
 * components:
 *   schemas:
 *     Testimonial:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         nome:
 *           type: string
 *           example: "Maria Silva"
 *         cargo:
 *           type: string
 *           example: "Voluntária"
 *         depoimento:
 *           type: string
 *           example: "Trabalhar com esta ONG mudou minha vida!"
 *         fotoUrl:
 *           type: string
 *           example: "https://example.com/foto.jpg"
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
 *     TestimonialRequest:
 *       type: object
 *       required:
 *         - nome
 *         - cargo
 *         - depoimento
 *       properties:
 *         nome:
 *           type: string
 *           example: "Maria Silva"
 *         cargo:
 *           type: string
 *           example: "Voluntária"
 *         depoimento:
 *           type: string
 *           example: "Trabalhar com esta ONG mudou minha vida!"
 *         fotoUrl:
 *           type: string
 *           example: "https://example.com/foto.jpg"
 *         ordem:
 *           type: integer
 *           example: 1
 *         ativo:
 *           type: boolean
 *           example: true
 *
 * tags:
 *   name: Testimonials
 *   description: 💬 Depoimentos
 */

/**
 * Cria rotas para Testimonials
 */
function createTestimonialRoutes(testimonialService, authService) {
  const router = express.Router();
  const TestimonialController = require('../controllers/TestimonialController');
  const testimonialController = new TestimonialController(testimonialService);
  const { authMiddleware } = require('../middleware/AuthMiddleware');
  const { adminMiddleware } = require('../middleware/AdminMiddleware');

  /**
   * @swagger
   * /api/testimonials:
   *   post:
   *     tags: [Testimonials]
   *     summary: Cria um novo depoimento (Admin)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TestimonialRequest'
   *     responses:
   *       201:
   *         description: Depoimento criado com sucesso
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
   *                   $ref: '#/components/schemas/Testimonial'
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autenticado
   *       403:
   *         description: Sem permissão
   */
  router.post('/', authMiddleware(authService), adminMiddleware(), testimonialController.create);

  /**
   * @swagger
   * /api/testimonials:
   *   get:
   *     tags: [Testimonials]
   *     summary: Lista todos os depoimentos
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
   *         description: Lista de depoimentos
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
   *                     $ref: '#/components/schemas/Testimonial'
   *                 pagination:
   *                   type: object
   */
  router.get('/', testimonialController.getAll);

  /**
   * @swagger
   * /api/testimonials/{id}:
   *   get:
   *     tags: [Testimonials]
   *     summary: Busca depoimento por ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Depoimento encontrado
   *       404:
   *         description: Depoimento não encontrado
   */
  router.get('/:id', testimonialController.getById);

  /**
   * @swagger
   * /api/testimonials/{id}:
   *   put:
   *     tags: [Testimonials]
   *     summary: Atualiza um depoimento (Admin)
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
   *             $ref: '#/components/schemas/TestimonialRequest'
   *     responses:
   *       200:
   *         description: Depoimento atualizado
   *       404:
   *         description: Depoimento não encontrado
   */
  router.put('/:id', authMiddleware(authService), adminMiddleware(), testimonialController.update);

  /**
   * @swagger
   * /api/testimonials/{id}:
   *   delete:
   *     tags: [Testimonials]
   *     summary: Deleta um depoimento (Admin)
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
   *         description: Depoimento deletado
   *       404:
   *         description: Depoimento não encontrado
   */
  router.delete(
    '/:id',
    authMiddleware(authService),
    adminMiddleware(),
    testimonialController.delete
  );

  /**
   * @swagger
   * /api/testimonials/{id}/toggle:
   *   patch:
   *     tags: [Testimonials]
   *     summary: Ativa/Desativa um depoimento (Admin)
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
   *         description: Depoimento não encontrado
   */
  router.patch(
    '/:id/toggle',
    authMiddleware(authService),
    adminMiddleware(),
    testimonialController.toggleActive
  );

  return router;
}

module.exports = createTestimonialRoutes;
