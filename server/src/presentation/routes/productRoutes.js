const express = require('express');
const ProductController = require('../controllers/ProductController');
const { authMiddleware, organizationMiddleware } = require('../middleware/AuthMiddleware');
const { createSimpleAuthMiddleware } = require('../middleware/SimpleAuthMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do produto
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Nome do produto
 *           example: "Cesta Básica Completa"
 *         description:
 *           type: string
 *           description: Descrição detalhada do produto
 *           example: "Cesta básica com alimentos essenciais para uma família"
 *         category:
 *           type: string
 *           description: Categoria do produto
 *           example: "Alimentação"
 *         price:
 *           type: number
 *           format: float
 *           description: Preço do produto
 *           example: 89.90
 *         stock:
 *           type: integer
 *           description: Quantidade em estoque
 *           example: 25
 *         isAvailable:
 *           type: boolean
 *           description: Se o produto está disponível
 *           example: true
 *         organizationId:
 *           type: string
 *           description: ID da organização responsável
 *           example: "507f1f77bcf86cd799439012"
 *         organizationName:
 *           type: string
 *           description: Nome da organização
 *           example: "ONG Esperança"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs das imagens do produto
 *           example: ["https://example.com/image1.jpg"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data de última atualização
 *
 *     ProductCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - category
 *         - price
 *         - stock
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do produto
 *           example: "Cesta Básica Completa"
 *         description:
 *           type: string
 *           description: Descrição detalhada do produto
 *           example: "Cesta básica com alimentos essenciais"
 *         category:
 *           type: string
 *           description: Categoria do produto
 *           example: "Alimentação"
 *         price:
 *           type: number
 *           format: float
 *           description: Preço do produto
 *           example: 89.90
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Quantidade em estoque
 *           example: 25
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs das imagens do produto
 *           example: ["https://example.com/image1.jpg"]
 *
 *     ProductUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do produto
 *           example: "Cesta Básica Premium"
 *         description:
 *           type: string
 *           description: Descrição detalhada do produto
 *         category:
 *           type: string
 *           description: Categoria do produto
 *         price:
 *           type: number
 *           format: float
 *           description: Preço do produto
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Quantidade em estoque
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs das imagens do produto
 */

const createProductRoutes = (productService, authService) => {
  const router = express.Router();
  const productController = new ProductController(productService);

  // Public routes

  /**
   * @swagger
   * /api/products:
   *   get:
   *     tags: [Products]
   *     summary: Listar produtos disponíveis
   *     description: Retorna todos os produtos disponíveis para compra
   *     responses:
   *       200:
   *         description: Lista de produtos obtida com sucesso
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
   *                     $ref: '#/components/schemas/Product'
   */
  router.get('/products', productController.getAllAvailableProducts);

  /**
   * @swagger
   * /api/products/search:
   *   get:
   *     tags: [Products]
   *     summary: Buscar produtos
   *     description: Busca produtos por nome, categoria ou descrição
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Termo de busca
   *         example: "cesta básica"
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filtrar por categoria
   *         example: "Alimentação"
   *       - in: query
   *         name: minPrice
   *         schema:
   *           type: number
   *         description: Preço mínimo
   *       - in: query
   *         name: maxPrice
   *         schema:
   *           type: number
   *         description: Preço máximo
   *     responses:
   *       200:
   *         description: Resultados da busca
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
   *                     $ref: '#/components/schemas/Product'
   */
  router.get('/products/search', productController.searchProducts);

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     tags: [Products]
   *     summary: Obter produto por ID
   *     description: Retorna detalhes de um produto específico
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do produto
   *         example: "507f1f77bcf86cd799439011"
   *     responses:
   *       200:
   *         description: Produto encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       404:
   *         description: Produto não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/products/:id', productController.getProduct);

  /**
   * @swagger
   * /api/products/{id}/whatsapp:
   *   get:
   *     tags: [Products]
   *     summary: Obter link do WhatsApp
   *     description: Gera link do WhatsApp para contato sobre o produto
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID do produto
   *         example: "507f1f77bcf86cd799439011"
   *     responses:
   *       200:
   *         description: Link do WhatsApp gerado
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
   *                     whatsappLink:
   *                       type: string
   *                       example: "https://wa.me/5511999999999?text=Olá..."
   */
  router.get('/products/:id/whatsapp', productController.getWhatsAppLink);

  // Protected routes (authentication required)
  // Usar o novo sistema simplificado se disponível
  const auth = authService.verifyAccessToken
    ? createSimpleAuthMiddleware(authService)
    : authMiddleware(authService);
  const organization = organizationMiddleware();

  // Organization-only routes

  /**
   * @swagger
   * /api/products:
   *   post:
   *     tags: [Products]
   *     summary: Criar novo produto
   *     description: Cria um novo produto (apenas organizações)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProductCreateRequest'
   *     responses:
   *       201:
   *         description: Produto criado com sucesso
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
   *                   example: "Product created successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Token inválido ou usuário não é organização
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/products', auth, organization, productController.createProduct);
  router.put('/products/:id', auth, organization, productController.updateProduct);
  router.delete('/products/:id', auth, organization, productController.deleteProduct);
  router.patch(
    '/products/:id/toggle',
    auth,
    organization,
    productController.toggleProductAvailability
  );
  router.patch('/products/:id/stock', auth, organization, productController.updateProductStock);
  router.get('/my-products', auth, organization, productController.getProductsByOrganization);

  return router;
};

module.exports = createProductRoutes;
