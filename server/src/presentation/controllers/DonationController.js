/**
 * CONTROLLER LAYER - Controlador de doações
 * Gerencia requisições HTTP relacionadas a doações
 */

class DonationController {
  constructor(donationService) {
    this.donationService = donationService;
    
    // Bind methods para manter contexto
    this.createSingleDonation = this.createSingleDonation.bind(this);
    this.createRecurringDonation = this.createRecurringDonation.bind(this);
    this.processWebhook = this.processWebhook.bind(this);
    this.getDonations = this.getDonations.bind(this);
    this.getDonationById = this.getDonationById.bind(this);
    this.cancelRecurringDonation = this.cancelRecurringDonation.bind(this);
    this.getDonationStatistics = this.getDonationStatistics.bind(this);
    
    console.log('[DONATION CONTROLLER] Inicializado com sucesso');
  }

  /**
   * Cria uma doação única
   * POST /api/donations/single
   */
  async createSingleDonation(req, res) {
    try {
      console.log('[DONATION CONTROLLER] Criando doação única:', req.body);

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
        isAnonymous,
        showInPublicList
      } = req.body;

      // Validações básicas
      if (!amount || !donorEmail || !donorName) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios: amount, donorEmail, donorName'
        });
      }

      const result = await this.donationService.createSingleDonation({
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
        showInPublicList
      });

      return res.status(201).json({
        success: true,
        message: 'Doação única criada com sucesso',
        data: {
          donationId: result.donation.id,
          paymentUrl: result.paymentUrl,
          mercadoPagoId: result.mercadoPagoId,
          amount: result.donation.amount
        }
      });

    } catch (error) {
      console.error('[DONATION CONTROLLER] Erro ao criar doação única:', error);
      
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar doação única'
      });
    }
  }

  /**
   * Cria uma doação recorrente
   * POST /api/donations/recurring
   */
  async createRecurringDonation(req, res) {
    try {
      console.log('[DONATION CONTROLLER] Criando doação recorrente:', req.body);

      const {
        amount,
        frequency,
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
        showInPublicList
      } = req.body;

      // Validações básicas
      if (!amount || !donorEmail || !donorName) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios: amount, donorEmail, donorName'
        });
      }

      const result = await this.donationService.createRecurringDonation({
        amount: parseFloat(amount),
        frequency: frequency || 'monthly',
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
        showInPublicList
      });

      return res.status(201).json({
        success: true,
        message: 'Doação recorrente criada com sucesso',
        data: {
          donationId: result.donation.id,
          subscriptionUrl: result.subscriptionUrl,
          subscriptionId: result.subscriptionId,
          amount: result.donation.amount,
          frequency: result.donation.frequency,
          organizationName: result.donation.organizationName
        }
      });

    } catch (error) {
      console.error('[DONATION CONTROLLER] Erro ao criar doação recorrente:', error);
      
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar doação recorrente'
      });
    }
  }

  /**
   * Processa webhook do Mercado Pago
   * POST /api/donations/webhook
   */
  async processWebhook(req, res) {
    try {
      console.log('[DONATION CONTROLLER] Processando webhook:', req.body);

      const webhookData = req.body;
      
      const result = await this.donationService.processPaymentWebhook(webhookData);
      
      console.log('[DONATION CONTROLLER] Webhook processado:', result);

      return res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso',
        data: result
      });

    } catch (error) {
      console.error('[DONATION CONTROLLER] Erro ao processar webhook:', error);
      
      // Retornar 200 mesmo com erro para não reenviar webhook
      return res.status(200).json({
        success: false,
        message: 'Erro ao processar webhook',
        error: error.message
      });
    }
  }

  /**
   * Lista doações de uma organização
   * GET /api/donations/organization/:organizationId
   */
  async getDonations(req, res) {
    try {
      const { organizationId } = req.params;
      const {
        status,
        type,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      // Verificar se o usuário tem permissão (deve ser da mesma organização)
      if (req.user && req.user.id !== organizationId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Não autorizado a visualizar essas doações'
        });
      }

      const filters = {
        status,
        type,
        startDate,
        endDate,
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      };

      const donations = await this.donationService.getDonationsByOrganization(
        organizationId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: donations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: donations.length
        }
      });

    } catch (error) {
      console.error('[DONATION CONTROLLER] Erro ao buscar doações:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar doações'
      });
    }
  }

  /**
   * Busca doação por ID
   * GET /api/donations/:id
   */
  async getDonationById(req, res) {
    try {
      const { id } = req.params;

      const donation = await this.donationService.donationRepository.findById(id);

      if (!donation) {
        return res.status(404).json({
          success: false,
          message: 'Doação não encontrada'
        });
      }

      // Verificar permissão
      if (req.user && req.user.id !== donation.organizationId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Não autorizado a visualizar esta doação'
        });
      }

      return res.status(200).json({
        success: true,
        data: donation
      });

    } catch (error) {
      console.error('[DONATION CONTROLLER] Erro ao buscar doação:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar doação'
      });
    }
  }

  /**
   * Cancela doação recorrente
   * DELETE /api/donations/:id/cancel
   */
  async cancelRecurringDonation(req, res) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.id;

      if (!organizationId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const result = await this.donationService.cancelRecurringDonation(id, organizationId);

      return res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('[DONATION CONTROLLER] Erro ao cancelar doação recorrente:', error);
      
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao cancelar doação recorrente'
      });
    }
  }

  /**
   * Obtém estatísticas de doações
   * GET /api/donations/organization/:organizationId/statistics
   */
  async getDonationStatistics(req, res) {
    try {
      const { organizationId } = req.params;
      const { startDate, endDate } = req.query;

      // Verificar permissão
      if (req.user && req.user.id !== organizationId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Não autorizado a visualizar essas estatísticas'
        });
      }

      const dateRange = {};
      if (startDate) dateRange.startDate = startDate;
      if (endDate) dateRange.endDate = endDate;

      const statistics = await this.donationService.donationRepository.getStatistics(
        organizationId,
        dateRange
      );

      return res.status(200).json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('[DONATION CONTROLLER] Erro ao obter estatísticas:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas'
      });
    }
  }
}

module.exports = DonationController;
