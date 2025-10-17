/**
 * Service para gerenciar Depoimentos
 */
class TestimonialService {
  constructor(testimonialRepository) {
    this.testimonialRepository = testimonialRepository;
  }

  /**
   * Cria um novo depoimento
   */
  async create(data) {
    try {
      console.log('[TESTIMONIAL SERVICE] Criando depoimento:', data);

      // Validações
      if (!data.nome || !data.cargo || !data.depoimento) {
        throw new Error('Nome, cargo e depoimento são obrigatórios');
      }

      const testimonial = await this.testimonialRepository.create(data);
      console.log('[TESTIMONIAL SERVICE] Depoimento criado com sucesso:', testimonial.id);
      return testimonial;
    } catch (error) {
      console.error('[TESTIMONIAL SERVICE] Erro ao criar depoimento:', error);
      throw error;
    }
  }

  /**
   * Lista todos os depoimentos
   */
  async getAll(filters = {}) {
    try {
      console.log('[TESTIMONIAL SERVICE] Buscando depoimentos com filtros:', filters);
      return await this.testimonialRepository.findAll(filters);
    } catch (error) {
      console.error('[TESTIMONIAL SERVICE] Erro ao buscar depoimentos:', error);
      throw error;
    }
  }

  /**
   * Busca depoimento por ID
   */
  async getById(id) {
    try {
      console.log('[TESTIMONIAL SERVICE] Buscando depoimento por ID:', id);
      const testimonial = await this.testimonialRepository.findById(id);

      if (!testimonial) {
        throw new Error('Depoimento não encontrado');
      }

      return testimonial;
    } catch (error) {
      console.error('[TESTIMONIAL SERVICE] Erro ao buscar depoimento:', error);
      throw error;
    }
  }

  /**
   * Atualiza um depoimento
   */
  async update(id, data) {
    try {
      console.log('[TESTIMONIAL SERVICE] Atualizando depoimento:', id);

      const testimonial = await this.testimonialRepository.update(id, data);

      if (!testimonial) {
        throw new Error('Depoimento não encontrado');
      }

      console.log('[TESTIMONIAL SERVICE] Depoimento atualizado com sucesso');
      return testimonial;
    } catch (error) {
      console.error('[TESTIMONIAL SERVICE] Erro ao atualizar depoimento:', error);
      throw error;
    }
  }

  /**
   * Deleta um depoimento
   */
  async delete(id) {
    try {
      console.log('[TESTIMONIAL SERVICE] Deletando depoimento:', id);

      const deleted = await this.testimonialRepository.delete(id);

      if (!deleted) {
        throw new Error('Depoimento não encontrado');
      }

      console.log('[TESTIMONIAL SERVICE] Depoimento deletado com sucesso');
      return true;
    } catch (error) {
      console.error('[TESTIMONIAL SERVICE] Erro ao deletar depoimento:', error);
      throw error;
    }
  }

  /**
   * Alterna status ativo/inativo
   */
  async toggleActive(id) {
    try {
      console.log('[TESTIMONIAL SERVICE] Alternando status do depoimento:', id);

      const testimonial = await this.testimonialRepository.toggleActive(id);

      if (!testimonial) {
        throw new Error('Depoimento não encontrado');
      }

      console.log('[TESTIMONIAL SERVICE] Status alternado com sucesso');
      return testimonial;
    } catch (error) {
      console.error('[TESTIMONIAL SERVICE] Erro ao alternar status:', error);
      throw error;
    }
  }
}

module.exports = TestimonialService;
