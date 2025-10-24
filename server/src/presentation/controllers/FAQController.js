/**
 * Controller para gerenciar FAQs
 */
class FAQController {
  constructor(faqService) {
    this.faqService = faqService;
    console.log('[FAQ CONTROLLER] Inicializado com sucesso');
  }

  /**
   * Cria uma nova FAQ
   */
  create = async (req, res) => {
    try {
      console.log('[FAQ CONTROLLER] Criando FAQ:', req.body);

      const { pergunta, resposta, ordem, ativo } = req.body;

      // Validações
      if (!pergunta || !resposta) {
        return res.status(400).json({
          success: false,
          message: 'Pergunta e resposta são obrigatórios',
        });
      }

      const faq = await this.faqService.create({
        pergunta,
        resposta,
        ordem: ordem || 0,
        ativo: ativo !== undefined ? ativo : true,
      });

      return res.status(201).json({
        success: true,
        message: 'FAQ criada com sucesso',
        data: faq,
      });
    } catch (error) {
      console.error('[FAQ CONTROLLER] Erro ao criar FAQ:', error);

      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar FAQ',
      });
    }
  };

  /**
   * Lista todas as FAQs
   */
  getAll = async (req, res) => {
    try {
      console.log('[FAQ CONTROLLER] Listando FAQs');

      const { page = 1, limit = 50, ativo } = req.query;

      const filters = {
        skip: (parseInt(page) - 1) * parseInt(limit),
        limit: parseInt(limit),
      };

      if (ativo !== undefined) {
        filters.ativo = ativo === 'true';
      }

      const result = await this.faqService.getAll(filters);

      return res.status(200).json({
        success: true,
        message: 'FAQs listadas com sucesso',
        data: result.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.pagination.total,
          pages: result.pagination.pages,
        },
      });
    } catch (error) {
      console.error('[FAQ CONTROLLER] Erro ao listar FAQs:', error);

      return res.status(500).json({
        success: false,
        message: 'Erro ao listar FAQs',
      });
    }
  };

  /**
   * Busca FAQ por ID
   */
  getById = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[FAQ CONTROLLER] Buscando FAQ:', id);

      const faq = await this.faqService.getById(id);

      return res.status(200).json({
        success: true,
        message: 'FAQ encontrada',
        data: faq,
      });
    } catch (error) {
      console.error('[FAQ CONTROLLER] Erro ao buscar FAQ:', error);

      if (error.message === 'FAQ não encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar FAQ',
      });
    }
  };

  /**
   * Atualiza uma FAQ
   */
  update = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[FAQ CONTROLLER] Atualizando FAQ:', id);

      const faq = await this.faqService.update(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'FAQ atualizada com sucesso',
        data: faq,
      });
    } catch (error) {
      console.error('[FAQ CONTROLLER] Erro ao atualizar FAQ:', error);

      if (error.message === 'FAQ não encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar FAQ',
      });
    }
  };

  /**
   * Deleta uma FAQ
   */
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[FAQ CONTROLLER] Deletando FAQ:', id);

      await this.faqService.delete(id);

      return res.status(200).json({
        success: true,
        message: 'FAQ deletada com sucesso',
      });
    } catch (error) {
      console.error('[FAQ CONTROLLER] Erro ao deletar FAQ:', error);

      if (error.message === 'FAQ não encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar FAQ',
      });
    }
  };

  /**
   * Alterna status ativo/inativo
   */
  toggleActive = async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[FAQ CONTROLLER] Alternando status da FAQ:', id);

      const faq = await this.faqService.toggleActive(id);

      return res.status(200).json({
        success: true,
        message: 'Status alternado com sucesso',
        data: faq,
      });
    } catch (error) {
      console.error('[FAQ CONTROLLER] Erro ao alternar status:', error);

      if (error.message === 'FAQ não encontrada') {
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

module.exports = FAQController;
