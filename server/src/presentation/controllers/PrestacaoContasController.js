/**
 * CONTROLLER LAYER - Controlador de Prestação de Contas
 * Gerencia requisições HTTP relacionadas a prestação de contas
 */

class PrestacaoContasController {
  constructor(prestacaoContasService) {
    this.prestacaoContasService = prestacaoContasService;

    // Bind methods para manter contexto
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.getByOrganization = this.getByOrganization.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getByCategory = this.getByCategory.bind(this);

    console.log('[PRESTACAO CONTAS CONTROLLER] Inicializado com sucesso');
  }

  /**
   * Cria uma nova prestação de contas
   * POST /api/prestacao-contas
   */
  async create(req, res) {
    try {
      console.log('[PRESTACAO CONTAS CONTROLLER] Criando prestação de contas:', req.body);

      const { titulo, ano, mes, mostrarTotal, colunas, linhas, colunasTotal, organizationId } =
        req.body;

      // Validações básicas
      if (!titulo || !ano || !colunas || !linhas) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios: titulo, ano, colunas, linhas',
        });
      }

      // Validar se colunas é um array
      if (!Array.isArray(colunas) || colunas.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Colunas deve ser um array não vazio',
        });
      }

      // Validar se linhas é um array
      if (!Array.isArray(linhas)) {
        return res.status(400).json({
          success: false,
          message: 'Linhas deve ser um array',
        });
      }

      // Obter organizationId do usuário autenticado se não foi fornecido
      const orgId = organizationId || req.user?.id;

      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'organizationId é obrigatório',
        });
      }

      const prestacao = await this.prestacaoContasService.create({
        titulo,
        ano: parseInt(ano),
        mes: mes ? parseInt(mes) : null,
        mostrarTotal: mostrarTotal !== false,
        colunas,
        linhas,
        colunasTotal: colunasTotal || [],
        organizationId: orgId,
      });

      return res.status(201).json({
        success: true,
        message: 'Prestação de contas criada com sucesso',
        data: prestacao,
      });
    } catch (error) {
      console.error('[PRESTACAO CONTAS CONTROLLER] Erro ao criar prestação de contas:', error);

      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar prestação de contas',
      });
    }
  }

  /**
   * Lista todas as prestações de contas
   * GET /api/prestacao-contas
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, categoria, organizationId } = req.query;

      const filters = {
        categoria,
        organizationId,
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
      };

      const prestacoes = await this.prestacaoContasService.getAll(filters);

      return res.status(200).json({
        success: true,
        data: prestacoes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: prestacoes.length,
        },
      });
    } catch (error) {
      console.error('[PRESTACAO CONTAS CONTROLLER] Erro ao buscar prestações:', error);

      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar prestações de contas',
      });
    }
  }

  /**
   * Busca prestação de contas por ID
   * GET /api/prestacao-contas/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const prestacao = await this.prestacaoContasService.getById(id);

      if (!prestacao) {
        return res.status(404).json({
          success: false,
          message: 'Prestação de contas não encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        data: prestacao,
      });
    } catch (error) {
      console.error('[PRESTACAO CONTAS CONTROLLER] Erro ao buscar prestação:', error);

      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar prestação de contas',
      });
    }
  }

  /**
   * Lista prestações de contas de uma organização
   * GET /api/prestacao-contas/organization/:organizationId
   */
  async getByOrganization(req, res) {
    try {
      const { organizationId } = req.params;
      const { page = 1, limit = 20, categoria, startDate, endDate } = req.query;

      const filters = {
        categoria,
        startDate,
        endDate,
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
      };

      const prestacoes = await this.prestacaoContasService.getByOrganization(
        organizationId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: prestacoes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: prestacoes.length,
        },
      });
    } catch (error) {
      console.error(
        '[PRESTACAO CONTAS CONTROLLER] Erro ao buscar prestações da organização:',
        error
      );

      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar prestações de contas da organização',
      });
    }
  }

  /**
   * Lista prestações de contas por categoria
   * GET /api/prestacao-contas/categoria/:categoria
   */
  async getByCategory(req, res) {
    try {
      const { categoria } = req.params;
      const { page = 1, limit = 20, organizationId } = req.query;

      const filters = {
        organizationId,
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
      };

      const prestacoes = await this.prestacaoContasService.getByCategory(categoria, filters);

      return res.status(200).json({
        success: true,
        data: prestacoes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: prestacoes.length,
        },
      });
    } catch (error) {
      console.error(
        '[PRESTACAO CONTAS CONTROLLER] Erro ao buscar prestações por categoria:',
        error
      );

      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar prestações de contas por categoria',
      });
    }
  }

  /**
   * Atualiza uma prestação de contas
   * PUT /api/prestacao-contas/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Converter tipos se necessário
      if (updateData.ano) {
        updateData.ano = parseInt(updateData.ano);
      }

      if (updateData.mes) {
        updateData.mes = parseInt(updateData.mes);
      }

      const prestacao = await this.prestacaoContasService.update(id, updateData);

      if (!prestacao) {
        return res.status(404).json({
          success: false,
          message: 'Prestação de contas não encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Prestação de contas atualizada com sucesso',
        data: prestacao,
      });
    } catch (error) {
      console.error('[PRESTACAO CONTAS CONTROLLER] Erro ao atualizar prestação:', error);

      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar prestação de contas',
      });
    }
  }

  /**
   * Deleta uma prestação de contas
   * DELETE /api/prestacao-contas/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const result = await this.prestacaoContasService.delete(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Prestação de contas não encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Prestação de contas deletada com sucesso',
      });
    } catch (error) {
      console.error('[PRESTACAO CONTAS CONTROLLER] Erro ao deletar prestação:', error);

      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar prestação de contas',
      });
    }
  }
}

module.exports = PrestacaoContasController;
