/**
 * CONTROLLER LAYER - Controlador de Doadores de Destaque
 * Gerencia requisições HTTP relacionadas aos doadores de destaque do mês
 */

class TopDonorController {
  constructor(topDonorService) {
    this.topDonorService = topDonorService;

    // Bind methods para manter contexto
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.getByPeriod = this.getByPeriod.bind(this);
    this.getByOrganization = this.getByOrganization.bind(this);
    this.getTopN = this.getTopN.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.deleteByPeriod = this.deleteByPeriod.bind(this);

    console.log('[TOP DONOR CONTROLLER] Inicializado com sucesso');
  }

  /**
   * Cria um novo doador de destaque
   * POST /api/top-donors
   */
  async create(req, res) {
    try {
      console.log('=== [TOP DONOR CONTROLLER] INÍCIO DO CREATE ===');
      console.log('[TOP DONOR CONTROLLER] req.body recebido:', JSON.stringify(req.body, null, 2));
      console.log('[TOP DONOR CONTROLLER] req.user:', req.user);

      const {
        donorName,
        topPosition,
        donatedAmount,
        donationType,
        donationDate,
        organizationId,
        organizationName,
        referenceMonth,
        referenceYear,
        metadata,
      } = req.body;

      console.log('[TOP DONOR CONTROLLER] Dados extraídos do body:', {
        donorName,
        topPosition,
        donatedAmount,
        donationType,
        donationDate,
        organizationId,
        organizationName,
        referenceMonth,
        referenceYear,
        metadata,
      });

      console.log('[TOP DONOR CONTROLLER] Chamando topDonorService.createTopDonor...');
      const topDonor = await this.topDonorService.createTopDonor({
        donorName,
        topPosition,
        donatedAmount,
        donationType,
        donationDate,
        organizationId,
        organizationName,
        referenceMonth,
        referenceYear,
        metadata,
      });

      console.log('[TOP DONOR CONTROLLER] Doador criado com sucesso:', topDonor);
      console.log('=== [TOP DONOR CONTROLLER] FIM DO CREATE (SUCESSO) ===');

      return res.status(201).json({
        success: true,
        message: 'Doador de destaque criado com sucesso',
        data: topDonor,
      });
    } catch (error) {
      console.error('=== [TOP DONOR CONTROLLER] ERRO NO CREATE ===');
      console.error('[TOP DONOR CONTROLLER] Tipo do erro:', error.constructor.name);
      console.error('[TOP DONOR CONTROLLER] Mensagem:', error.message);
      console.error('[TOP DONOR CONTROLLER] Stack:', error.stack);
      console.error('=== [TOP DONOR CONTROLLER] FIM DO ERRO ===');

      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar doador de destaque',
      });
    }
  }

  /**
   * Lista todos os doadores de destaque com filtros
   * GET /api/top-donors
   * Query params: page, limit, year, month, organizationId, donationType
   */
  async getAll(req, res) {
    try {
      console.log('[TOP DONOR CONTROLLER] Listando doadores de destaque:', req.query);

      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        year: req.query.year,
        month: req.query.month,
        organizationId: req.query.organizationId,
        donationType: req.query.donationType,
      };

      const result = await this.topDonorService.listTopDonors(filters);

      return res.status(200).json({
        success: true,
        message: 'Doadores de destaque listados com sucesso',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('[TOP DONOR CONTROLLER] Erro ao listar doadores de destaque:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao listar doadores de destaque',
      });
    }
  }

  /**
   * Busca um doador de destaque por ID
   * GET /api/top-donors/:id
   */
  async getById(req, res) {
    try {
      console.log('[TOP DONOR CONTROLLER] Buscando doador de destaque por ID:', req.params.id);

      const topDonor = await this.topDonorService.getTopDonorById(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Doador de destaque encontrado',
        data: topDonor,
      });
    } catch (error) {
      console.error('[TOP DONOR CONTROLLER] Erro ao buscar doador de destaque:', error);

      const statusCode = error.message === 'Doador de destaque não encontrado' ? 404 : 400;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao buscar doador de destaque',
      });
    }
  }

  /**
   * Busca doadores de destaque por período
   * GET /api/top-donors/period/:year/:month
   */
  async getByPeriod(req, res) {
    try {
      const { year, month } = req.params;
      console.log(`[TOP DONOR CONTROLLER] Buscando doadores do período ${month}/${year}`);

      const topDonors = await this.topDonorService.getTopDonorsByPeriod(
        Number(month),
        Number(year)
      );

      return res.status(200).json({
        success: true,
        message: 'Doadores de destaque encontrados',
        data: topDonors,
      });
    } catch (error) {
      console.error('[TOP DONOR CONTROLLER] Erro ao buscar por período:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar doadores por período',
      });
    }
  }

  /**
   * Busca doadores de destaque por organização
   * GET /api/top-donors/organization/:organizationId
   */
  async getByOrganization(req, res) {
    try {
      const { organizationId } = req.params;
      console.log('[TOP DONOR CONTROLLER] Buscando doadores por organização:', organizationId);

      const topDonors = await this.topDonorService.getTopDonorsByOrganization(organizationId);

      return res.status(200).json({
        success: true,
        message: 'Doadores de destaque encontrados',
        data: topDonors,
      });
    } catch (error) {
      console.error('[TOP DONOR CONTROLLER] Erro ao buscar por organização:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar doadores por organização',
      });
    }
  }

  /**
   * Busca o top N doadores de um período
   * GET /api/top-donors/top/:year/:month/:limit
   */
  async getTopN(req, res) {
    try {
      const { year, month, limit } = req.params;
      console.log(`[TOP DONOR CONTROLLER] Buscando top ${limit} doadores de ${month}/${year}`);

      const topDonors = await this.topDonorService.getTopN(
        Number(month),
        Number(year),
        Number(limit)
      );

      return res.status(200).json({
        success: true,
        message: `Top ${limit} doadores encontrados`,
        data: topDonors,
      });
    } catch (error) {
      console.error('[TOP DONOR CONTROLLER] Erro ao buscar top N:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao buscar top N doadores',
      });
    }
  }

  /**
   * Atualiza um doador de destaque
   * PUT /api/top-donors/:id
   */
  async update(req, res) {
    try {
      console.log('[TOP DONOR CONTROLLER] Atualizando doador de destaque:', req.params.id);

      const topDonor = await this.topDonorService.updateTopDonor(req.params.id, req.body);

      return res.status(200).json({
        success: true,
        message: 'Doador de destaque atualizado com sucesso',
        data: topDonor,
      });
    } catch (error) {
      console.error('[TOP DONOR CONTROLLER] Erro ao atualizar doador de destaque:', error);

      const statusCode = error.message === 'Doador de destaque não encontrado' ? 404 : 400;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao atualizar doador de destaque',
      });
    }
  }

  /**
   * Deleta um doador de destaque
   * DELETE /api/top-donors/:id
   */
  async delete(req, res) {
    try {
      console.log('[TOP DONOR CONTROLLER] Deletando doador de destaque:', req.params.id);

      const result = await this.topDonorService.deleteTopDonor(req.params.id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('[TOP DONOR CONTROLLER] Erro ao deletar doador de destaque:', error);

      const statusCode = error.message === 'Doador de destaque não encontrado' ? 404 : 400;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao deletar doador de destaque',
      });
    }
  }

  /**
   * Deleta todos os doadores de um período
   * DELETE /api/top-donors/period/:year/:month
   */
  async deleteByPeriod(req, res) {
    try {
      const { year, month } = req.params;
      console.log(`[TOP DONOR CONTROLLER] Deletando doadores do período ${month}/${year}`);

      const result = await this.topDonorService.deleteTopDonorsByPeriod(
        Number(month),
        Number(year)
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        count: result.count,
      });
    } catch (error) {
      console.error('[TOP DONOR CONTROLLER] Erro ao deletar por período:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao deletar doadores por período',
      });
    }
  }
}

module.exports = TopDonorController;
