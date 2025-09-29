const express = require("express");
const DonationController = require("../controllers/DonationController");
const { createSimpleAuthMiddleware } = require("../middleware/SimpleAuthMiddleware");
const { validateBody } = require("../middleware/validationMiddleware");
const { singleDonationSchema, recurringDonationSchema } = require("../../application/validators/donationSchemas");

/**
 * @swagger
 * components:
 *   schemas:
 *     Donation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único da doação
 *           example: "507f1f77bcf86cd799439011"
 *         organizationId:
 *           type: string
 *           description: ID da organização
 *           example: "507f1f77bcf86cd799439012"
 *         organizationName:
 *           type: string
 *           description: Nome da organização
 *           example: "ONG Esperança"
 *         amount:
 *           type: number
 *           format: float
 *           description: Valor da doação
 *           example: 50.00
 *         currency:
 *           type: string
 *           description: Moeda da doação
 *           example: "BRL"
 *         type:
 *           type: string
 *           enum: [single, recurring]
 *           description: Tipo da doação
 *           example: "single"
 *         frequency:
 *           type: string
 *           enum: [monthly, weekly, yearly]
 *           description: Frequência (apenas para recorrentes)
 *           example: "monthly"
 *         donorName:
 *           type: string
 *           description: Nome do doador
 *           example: "João Silva"
 *         donorEmail:
 *           type: string
 *           description: Email do doador
 *           example: "joao@email.com"
 *         donorPhone:
 *           type: string
 *           description: Telefone do doador
 *           example: "11999999999"
 *         donorDocument:
 *           type: string
 *           description: CPF do doador
 *           example: "12345678901"
 *         paymentStatus:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *           description: Status do pagamento
 *           example: "pending"
 *         mercadoPagoId:
 *           type: string
 *           description: ID do pagamento no Mercado Pago
 *         subscriptionId:
 *           type: string
 *           description: ID da assinatura (para recorrentes)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data de atualização
 *     
 *     SingleDonationRequest:
 *       type: object
 *       required:
 *         - organizationId
 *         - amount
 *         - donorEmail
 *       properties:
 *         organizationId:
 *           type: string
 *           description: ID da organização
 *           example: "507f1f77bcf86cd799439012"
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 1
 *           description: Valor da doação
 *           example: 50.00
 *         donorName:
 *           type: string
 *           description: Nome do doador
 *           example: "João Silva"
 *         donorEmail:
 *           type: string
 *           format: email
 *           description: Email do doador
 *           example: "joao@email.com"
 *         donorPhone:
 *           type: string
 *           description: Telefone do doador
 *           example: "11999999999"
 *         donorDocument:
 *           type: string
 *           description: CPF do doador
 *           example: "12345678901"
 *         message:
 *           type: string
 *           description: Mensagem do doador
 *           example: "Parabéns pelo trabalho!"
 *     
 *     RecurringDonationRequest:
 *       type: object
 *       required:
 *         - organizationId
 *         - amount
 *         - donorEmail
 *       properties:
 *         organizationId:
 *           type: string
 *           description: ID da organização
 *           example: "507f1f77bcf86cd799439012"
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 1
 *           description: Valor mensal da doação
 *           example: 30.00
 *         frequency:
 *           type: string
 *           enum: [monthly, weekly, yearly]
 *           description: Frequência da doação
 *           example: "monthly"
 *         donorName:
 *           type: string
 *           description: Nome do doador
 *           example: "João Silva"
 *         donorEmail:
 *           type: string
 *           format: email
 *           description: Email do doador
 *           example: "joao@email.com"
 *         donorPhone:
 *           type: string
 *           description: Telefone do doador
 *           example: "11999999999"
 *         donorDocument:
 *           type: string
 *           description: CPF do doador
 *           example: "12345678901"
 *         message:
 *           type: string
 *           description: Mensagem do doador
 *           example: "Quero apoiar mensalmente!"
 */

const createDonationRoutes = (donationService, authService) => {
  const router = express.Router();
  const donationController = new DonationController(donationService);

  // Middleware de autenticação (opcional para algumas rotas)
  const auth = authService ? createSimpleAuthMiddleware(authService) : null;

  // Rotas públicas (não precisam de autenticação)

  /**
   * @swagger
   * /api/donations/single:
   *   post:
   *     tags: [Donations]
   *     summary: Criar doação única
   *     description: Cria uma nova doação única via Mercado Pago
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SingleDonationRequest'
   *     responses:
   *       201:
   *         description: Doação criada com sucesso
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
   *                   example: "Doação única criada com sucesso"
   *                 data:
   *                   type: object
   *                   properties:
   *                     donationId:
   *                       type: string
   *                       example: "507f1f77bcf86cd799439011"
   *                     paymentUrl:
   *                       type: string
   *                       example: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123"
   *                     mercadoPagoId:
   *                       type: string
   *                       example: "123456789"
   *                     amount:
   *                       type: number
   *                       example: 50.00
   *                     organizationName:
   *                       type: string
   *                       example: "ONG Esperança"
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/single", validateBody(singleDonationSchema), donationController.createSingleDonation);
  
  // Alias para compatibilidade com testes existentes
  router.post("/donate", validateBody(singleDonationSchema), donationController.createSingleDonation);

  /**
   * @swagger
   * /api/donations/recurring:
   *   post:
   *     tags: [Donations]
   *     summary: Criar doação recorrente
   *     description: Cria uma nova doação recorrente via Mercado Pago
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RecurringDonationRequest'
   *     responses:
   *       201:
   *         description: Doação recorrente criada com sucesso
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
   *                   example: "Doação recorrente criada com sucesso"
   *                 data:
   *                   type: object
   *                   properties:
   *                     donationId:
   *                       type: string
   *                       example: "507f1f77bcf86cd799439011"
   *                     subscriptionUrl:
   *                       type: string
   *                       example: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=123"
   *                     subscriptionId:
   *                       type: string
   *                       example: "123456789"
   *                     amount:
   *                       type: number
   *                       example: 30.00
   *                     frequency:
   *                       type: string
   *                       example: "monthly"
   *                     organizationName:
   *                       type: string
   *                       example: "ONG Esperança"
   *       400:
   *         description: Dados inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post("/recurring", validateBody(recurringDonationSchema), donationController.createRecurringDonation);

  /**
   * @swagger
   * /api/donations/recurring/{subscriptionId}:
   *   delete:
   *     tags: [Donations]
   *     summary: Cancelar assinatura recorrente
   *     description: Cancela uma assinatura recorrente no Mercado Pago
   *     parameters:
   *       - in: path
   *         name: subscriptionId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da assinatura no Mercado Pago
   *     responses:
   *       200:
   *         description: Assinatura cancelada com sucesso
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
   *                   example: "Doação recorrente cancelada com sucesso"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     status:
   *                       type: string
   *                       example: "cancelled"
   *       400:
   *         description: Erro ao cancelar assinatura
   */
  router.delete("/recurring/:subscriptionId", donationController.cancelRecurringDonation);

  /**
   * @swagger
   * /api/donations/recurring/{subscriptionId}/status:
   *   get:
   *     tags: [Donations]
   *     summary: Consultar status da assinatura
   *     description: Consulta o status atual de uma assinatura recorrente
   *     parameters:
   *       - in: path
   *         name: subscriptionId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID da assinatura no Mercado Pago
   *     responses:
   *       200:
   *         description: Status consultado com sucesso
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
   *                   example: "Status da assinatura consultado com sucesso"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     status:
   *                       type: string
   *                       example: "authorized"
   *                     amount:
   *                       type: number
   *                       example: 25.00
   *                     frequency:
   *                       type: string
   *                       example: "months"
   *       400:
   *         description: Erro ao consultar status
   */
  router.get("/recurring/:subscriptionId/status", donationController.getSubscriptionStatus);

  /**
   * @swagger
   * /api/donations/webhook:
   *   post:
   *     tags: [Donations]
   *     summary: Webhook do Mercado Pago
   *     description: Endpoint para receber notificações do Mercado Pago
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 example: "payment"
   *               data:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     example: "123456789"
   *     responses:
   *       200:
   *         description: Webhook processado
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
   *                   example: "Webhook processado com sucesso"
   */
  router.post("/webhook", donationController.processWebhook);

  // Rotas protegidas (precisam de autenticação)
  if (auth) {
    /**
     * @swagger
     * /api/donations/organization/{organizationId}:
     *   get:
     *     tags: [Donations]
     *     summary: Listar doações da organização
     *     description: Lista todas as doações de uma organização (requer autenticação)
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
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [pending, approved, rejected, cancelled]
     *         description: Filtrar por status
     *       - in: query
     *         name: type
     *         schema:
     *           type: string
     *           enum: [single, recurring]
     *         description: Filtrar por tipo
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
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Página
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *         description: Itens por página
     *     responses:
     *       200:
     *         description: Lista de doações
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
     *                     $ref: '#/components/schemas/Donation'
     *       403:
     *         description: Não autorizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    router.get("/organization/:organizationId", auth, donationController.getDonations);

    /**
     * @swagger
     * /api/donations/{id}:
     *   get:
     *     tags: [Donations]
     *     summary: Obter doação por ID
     *     description: Retorna detalhes de uma doação específica (requer autenticação)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID da doação
     *         example: "507f1f77bcf86cd799439011"
     *     responses:
     *       200:
     *         description: Doação encontrada
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   $ref: '#/components/schemas/Donation'
     *       404:
     *         description: Doação não encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    router.get("/:id", auth, donationController.getDonationById);

    /**
     * @swagger
     * /api/donations/{id}/cancel:
     *   delete:
     *     tags: [Donations]
     *     summary: Cancelar doação recorrente
     *     description: Cancela uma doação recorrente (requer autenticação)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID da doação
     *         example: "507f1f77bcf86cd799439011"
     *     responses:
     *       200:
     *         description: Doação cancelada com sucesso
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
     *                   example: "Doação recorrente cancelada com sucesso"
     *       400:
     *         description: Erro ao cancelar
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    router.delete("/:id/cancel", auth, donationController.cancelRecurringDonation);

    /**
     * @swagger
     * /api/donations/organization/{organizationId}/statistics:
     *   get:
     *     tags: [Donations]
     *     summary: Estatísticas de doações
     *     description: Retorna estatísticas das doações de uma organização (requer autenticação)
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
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *         description: Data inicial para análise
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *         description: Data final para análise
     *     responses:
     *       200:
     *         description: Estatísticas obtidas com sucesso
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
     *                     totalDonations:
     *                       type: integer
     *                       example: 150
     *                     totalAmount:
     *                       type: number
     *                       example: 5000.00
     *                     avgAmount:
     *                       type: number
     *                       example: 33.33
     *                     singleDonations:
     *                       type: integer
     *                       example: 100
     *                     recurringDonations:
     *                       type: integer
     *                       example: 50
     *                     approvedDonations:
     *                       type: integer
     *                       example: 140
     *                     pendingDonations:
     *                       type: integer
     *                       example: 10
     */
    router.get("/organization/:organizationId/statistics", auth, donationController.getDonationStatistics);
  }

  return router;
};

module.exports = createDonationRoutes;
