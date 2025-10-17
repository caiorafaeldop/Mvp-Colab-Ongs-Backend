/**
 * Controller para gerenciar Depoimentos
 */
class TestimonialController {
  constructor(testimonialService) {
    this.testimonialService = testimonialService;
    console.log('[TESTIMONIAL CONTROLLER] Inicializado com sucesso');
  }

  /**
   * Cria um novo depoimento
   */
  create = async (req, res) => {
    try {
      console.log('[TESTIMONIAL CONTROLLER] Criando depoimento:', req.body);

      const { nome, cargo, depoimento, fotoUrl, ordem, ativo } = req.body;

      // Validações
      if (!nome || !cargo || !depoimento) {
        return res.status(400).json({
          success: false,
          message: 'Nome, cargo e depoimento são obrigatórios',
        });
      }

      const testimonial = await this.testimonialService.create({
        nome,
        cargo,
        depoimento,
        fotoUrl,
        ordem: ordem || 0,
        ativo: ativo !== undefined ? ativo : true,
      });

      return res.status(201).json({
        success: true,
        message: 'Depoimento criado com sucesso',
        data: testimonial,
      });
    } catch (error) {
      console.error('[TESTIMONIAL CONTROLLER] Erro ao criar depoimento:', error);

      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar depoimento',
      });
    }
  };

  /**
   * Lista todos os depoimentos
   */
  getAll = async (req, res) => {
    try {
      console.log('[TESTIMONIAL CONTROLLER] Listando depoimentos');

      const { page = 1, limit = 50, ativo } = req.query;

      const filters = {
        skip: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit),
      };

      if (ativo !== undefined) {
        filters.ativo = ativo === 'true';
      }

      const result = await this.testimonialService.getAll(filters);

      return res.status(200).json({
        success: true,
        message: 'Depoimentos listados com sucesso',
        data: result.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.pagination.total,
          pages: result.pagination.pages,
        },
      });
    } catch (error) {
      console.error('[TESTIMONIAL CONTROLLER] Erro ao listar depoimentos:', error);

      return res.status(500).json({
        success: false,
        message: 'Erro ao listar depoimentos',
      });
    }
  };

  /**
   * Busca depoimento por ID
   */
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[TESTIMONIAL CONTROLLER] Buscando depoimento:', id);

      const testimonial = await this.testimonialService.getById(id);

      return res.status(200).json({
        success: true,
        message: 'Depoimento encontrado',
        data: testimonial,
      });
    } catch (error) {
      console.error('[TESTIMONIAL CONTROLLER] Erro ao buscar depoimento:', error);

      if (error.message === 'Depoimento não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar depoimento',
      });
    }
  };

  /**
   * Atualiza um depoimento
   */
  update = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[TESTIMONIAL CONTROLLER] Atualizando depoimento:', id);

      const testimonial = await this.testimonialService.update(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'Depoimento atualizado com sucesso',
        data: testimonial,
      });
    } catch (error) {
      console.error('[TESTIMONIAL CONTROLLER] Erro ao atualizar depoimento:', error);

      if (error.message === 'Depoimento não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar depoimento',
      });
    }
  };

  /**
   * Deleta um depoimento
   */
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[TESTIMONIAL CONTROLLER] Deletando depoimento:', id);

      await this.testimonialService.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Depoimento deletado com sucesso',
      });
    } catch (error) {
      console.error('[TESTIMONIAL CONTROLLER] Erro ao deletar depoimento:', error);

      if (error.message === 'Depoimento não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar depoimento',
      });
    }
  };

  /**
   * Alterna status ativo/inativo
   */
  toggleActive = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[TESTIMONIAL CONTROLLER] Alternando status do depoimento:', id);

      const testimonial = await this.testimonialService.toggleActive(id);

      return res.status(200).json({
        success: true,
        message: 'Status alternado com sucesso',
        data: testimonial,
      });
    } catch (error) {
      console.error('[TESTIMONIAL CONTROLLER] Erro ao alternar status:', error);

      if (error.message === 'Depoimento não encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao alternar status',
      });
    }
  };
}

module.exports = TestimonialController;
