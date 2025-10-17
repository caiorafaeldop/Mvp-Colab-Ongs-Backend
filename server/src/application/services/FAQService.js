/**
 * Service para gerenciar FAQs
 */
class FAQService {
  constructor(faqRepository) {
    this.faqRepository = faqRepository;
  }

  /**
   * Cria uma nova pergunta
   */
  async create(data) {
    try {
      console.log('[FAQ SERVICE] Criando FAQ:', data);

      // Validações
      if (!data.pergunta || !data.resposta) {
        throw new Error('Pergunta e resposta são obrigatórios');
      }

      const faq = await this.faqRepository.create(data);
      console.log('[FAQ SERVICE] FAQ criada com sucesso:', faq.id);
      return faq;
    } catch (error) {
      console.error('[FAQ SERVICE] Erro ao criar FAQ:', error);
      throw error;
    }
  }

  /**
   * Lista todas as FAQs
   */
  async getAll(filters = {}) {
    try {
      console.log('[FAQ SERVICE] Buscando FAQs com filtros:', filters);
      return await this.faqRepository.findAll(filters);
    } catch (error) {
      console.error('[FAQ SERVICE] Erro ao buscar FAQs:', error);
      throw error;
    }
  }

  /**
   * Busca FAQ por ID
   */
  async getById(id) {
    try {
      console.log('[FAQ SERVICE] Buscando FAQ por ID:', id);
      const faq = await this.faqRepository.findById(id);

      if (!faq) {
        throw new Error('FAQ não encontrada');
      }

      return faq;
    } catch (error) {
      console.error('[FAQ SERVICE] Erro ao buscar FAQ:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma FAQ
   */
  async update(id, data) {
    try {
      console.log('[FAQ SERVICE] Atualizando FAQ:', id);

      const faq = await this.faqRepository.update(id, data);

      if (!faq) {
        throw new Error('FAQ não encontrada');
      }

      console.log('[FAQ SERVICE] FAQ atualizada com sucesso');
      return faq;
    } catch (error) {
      console.error('[FAQ SERVICE] Erro ao atualizar FAQ:', error);
      throw error;
    }
  }

  /**
   * Deleta uma FAQ
   */
  async delete(id) {
    try {
      console.log('[FAQ SERVICE] Deletando FAQ:', id);

      const deleted = await this.faqRepository.delete(id);

      if (!deleted) {
        throw new Error('FAQ não encontrada');
      }

      console.log('[FAQ SERVICE] FAQ deletada com sucesso');
      return true;
    } catch (error) {
      console.error('[FAQ SERVICE] Erro ao deletar FAQ:', error);
      throw error;
    }
  }

  /**
   * Alterna status ativo/inativo
   */
  async toggleActive(id) {
    try {
      console.log('[FAQ SERVICE] Alternando status da FAQ:', id);

      const faq = await this.faqRepository.toggleActive(id);

      if (!faq) {
        throw new Error('FAQ não encontrada');
      }

      console.log('[FAQ SERVICE] Status alternado com sucesso');
      return faq;
    } catch (error) {
      console.error('[FAQ SERVICE] Erro ao alternar status:', error);
      throw error;
    }
  }
}

module.exports = FAQService;
