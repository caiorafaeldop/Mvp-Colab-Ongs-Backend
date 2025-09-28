/**
 * 💰 ROTAS DE DOAÇÕES - UMA ONG
 * Sistema simplificado para uma ONG específica
 */

const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DonationRequest:
 *       type: object
 *       required:
 *         - amount
 *         - donorName
 *         - donorEmail
 *       properties:
 *         amount:
 *           type: number
 *           minimum: 1
 *           example: 25.00
 *           description: Valor da doação em reais
 *         donorName:
 *           type: string
 *           example: "Maria Silva"
 *           description: Nome completo do doador
 *         donorEmail:
 *           type: string
 *           format: email
 *           example: "maria@email.com"
 *           description: Email do doador
 *         donorPhone:
 *           type: string
 *           example: "11999999999"
 *           description: Telefone do doador (opcional)
 *         donorDocument:
 *           type: string
 *           example: "12345678901"
 *           description: CPF do doador (opcional)
 *         donorAddress:
 *           type: string
 *           example: "Rua das Flores, 123"
 *           description: Endereço do doador (opcional)
 *         donorCity:
 *           type: string
 *           example: "São Paulo"
 *           description: Cidade do doador (opcional)
 *         donorState:
 *           type: string
 *           example: "SP"
 *           description: Estado do doador (opcional)
 *         donorZipCode:
 *           type: string
 *           example: "01234-567"
 *           description: CEP do doador (opcional)
 *         message:
 *           type: string
 *           example: "Parabéns pelo trabalho incrível!"
 *           description: Mensagem do doador (opcional)
 *         isAnonymous:
 *           type: boolean
 *           default: false
 *           description: Se o doador quer ficar anônimo
 *         showInPublicList:
 *           type: boolean
 *           default: true
 *           description: Se pode aparecer na lista pública de doadores
 * 
 *     DonationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         donation:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "507f1f77bcf86cd799439012"
 *             amount:
 *               type: number
 *               example: 25.00
 *             status:
 *               type: string
 *               example: "pending"
 *         payment:
 *           type: object
 *           properties:
 *             paymentUrl:
 *               type: string
 *               example: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=..."
 *             preferenceId:
 *               type: string
 *               example: "1992214220-abc123..."
 */

/**
 * @swagger
 * /api/donations/donate:
 *   post:
 *     summary: Fazer uma doação
 *     description: Cria uma nova doação e retorna link de pagamento do Mercado Pago
 *     tags: [Donations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DonationRequest'
 *           examples:
 *             donation_25:
 *               summary: Doação de R$ 25
 *               value:
 *                 amount: 25.00
 *                 donorName: "Maria Silva"
 *                 donorEmail: "maria@email.com"
 *                 donorPhone: "11999999999"
 *                 message: "Parabéns pelo trabalho!"
 *             donation_100:
 *               summary: Doação de R$ 100
 *               value:
 *                 amount: 100.00
 *                 donorName: "João Santos"
 *                 donorEmail: "joao@email.com"
 *                 donorDocument: "12345678901"
 *                 donorAddress: "Rua das Flores, 123"
 *                 donorCity: "São Paulo"
 *                 donorState: "SP"
 *                 message: "Continuem o excelente trabalho!"
 *                 isAnonymous: false
 *     responses:
 *       201:
 *         description: Doação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DonationResponse'
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/donate', async (req, res) => {
  try {
    const {
      amount,
      donorName,
      donorEmail,
      donorPhone,
      donorDocument,
      donorAddress,
      donorCity,
      donorState,
      donorZipCode,
      message,
      isAnonymous = false,
      showInPublicList = true
    } = req.body;

    // Validações básicas
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Valor da doação deve ser maior que R$ 1,00'
      });
    }

    if (!donorName || !donorEmail) {
      return res.status(400).json({
        success: false,
        error: 'Nome e email são obrigatórios'
      });
    }

    // Buscar repositories
    const donationRepository = req.app.locals.repositories.donationRepository;
    const mercadoPagoAdapter = req.app.locals.adapters.mercadoPago;

    // Criar doação no banco
    const donationData = {
      amount: parseFloat(amount),
      donorName,
      donorEmail,
      donorPhone,
      donorDocument,
      donorAddress,
      donorCity,
      donorState,
      donorZipCode,
      message,
      isAnonymous,
      showInPublicList,
      paymentStatus: 'pending'
    };

    const donation = await donationRepository.create(donationData);

    // Criar preferência no Mercado Pago
    const paymentData = {
      amount: donation.amount,
      title: `Doação para ONG - R$ ${donation.amount}`,
      description: donation.message || 'Doação para apoiar nosso trabalho',
      externalReference: donation.id,
      payer: {
        name: donation.donorName,
        email: donation.donorEmail,
        phone: donation.donorPhone,
        document: donation.donorDocument
      }
    };

    const preference = await mercadoPagoAdapter.createPaymentPreference(paymentData);

    // Atualizar doação com ID do Mercado Pago
    await donationRepository.update(donation.id, {
      mercadoPagoId: preference.id
    });

    res.status(201).json({
      success: true,
      donation: {
        id: donation.id,
        amount: donation.amount,
        status: donation.paymentStatus,
        donorName: donation.isAnonymous ? 'Anônimo' : donation.donorName
      },
      payment: {
        paymentUrl: preference.paymentUrl,
        preferenceId: preference.id
      }
    });

  } catch (error) {
    console.error('[DONATION ROUTES] Erro ao criar doação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/donations/public:
 *   get:
 *     summary: Lista doações públicas
 *     description: Retorna lista de doações que podem ser exibidas publicamente
 *     tags: [Donations]
 *     parameters:
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
 *                 donations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       donorName:
 *                         type: string
 *                       message:
 *                         type: string
 *                       createdAt:
 *                         type: string
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
 */
router.get('/public', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const donationRepository = req.app.locals.repositories.donationRepository;
    
    const result = await donationRepository.findPublicDonations({
      page,
      limit
    });

    // Filtrar dados sensíveis
    const publicDonations = result.data.map(donation => ({
      id: donation.id,
      amount: donation.amount,
      donorName: donation.isAnonymous ? 'Doador Anônimo' : donation.donorName,
      message: donation.message,
      createdAt: donation.createdAt
    }));

    res.json({
      success: true,
      donations: publicDonations,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('[DONATION ROUTES] Erro ao buscar doações públicas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/donations/webhook:
 *   post:
 *     summary: Webhook do Mercado Pago
 *     description: Recebe notificações de pagamento do Mercado Pago
 *     tags: [Donations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processado
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 WEBHOOK RECEBIDO:', req.body);

    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar informações do pagamento
      const mercadoPagoAdapter = req.app.locals.adapters.mercadoPago;
      const paymentInfo = await mercadoPagoAdapter.getPaymentStatus(paymentId);

      // Atualizar doação no banco
      const donationRepository = req.app.locals.repositories.donationRepository;
      const donation = await donationRepository.findByMercadoPagoId(paymentId);

      if (donation) {
        await donationRepository.update(donation.id, {
          paymentStatus: paymentInfo.status,
          paymentMethod: paymentInfo.paymentMethod
        });

        console.log(`💰 Doação ${donation.id} atualizada: ${paymentInfo.status}`);
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('[DONATION WEBHOOK] Erro:', error);
    res.status(200).json({ success: false }); // Sempre retornar 200 para o MP
  }
});

/**
 * @swagger
 * /api/donations/stats:
 *   get:
 *     summary: Estatísticas de doações
 *     description: Retorna estatísticas gerais das doações
 *     tags: [Donations]
 *     responses:
 *       200:
 *         description: Estatísticas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalDonations:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     avgAmount:
 *                       type: number
 *                     approvedDonations:
 *                       type: integer
 */
router.get('/stats', async (req, res) => {
  try {
    const donationRepository = req.app.locals.repositories.donationRepository;
    const stats = await donationRepository.getGeneralStatistics();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('[DONATION ROUTES] Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
