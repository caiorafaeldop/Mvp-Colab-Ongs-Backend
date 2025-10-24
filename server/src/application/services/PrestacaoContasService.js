/**
 * SERVICE LAYER - Serviço de Prestação de Contas
 * Contém a lógica de negócio para prestação de contas
 */

class PrestacaoContasService {
  constructor(prestacaoContasRepository) {
    this.prestacaoContasRepository = prestacaoContasRepository;
    console.log('[PRESTACAO CONTAS SERVICE] Inicializado com sucesso');
  }

  /**
   * Cria uma nova prestação de contas
   */
  async create(data) {
    try {
      console.log('[PRESTACAO CONTAS SERVICE] Criando prestação de contas:', data);

      // Validações de negócio para nova estrutura (colunas e linhas)
      if (!data.titulo || !data.ano) {
        throw new Error('Título e ano são obrigatórios');
      }

      if (!Array.isArray(data.colunas) || data.colunas.length === 0) {
        throw new Error('Colunas deve ser um array não vazio');
      }

      if (!Array.isArray(data.linhas)) {
        throw new Error('Linhas deve ser um array');
      }

      // Validar estrutura antigo (compatibilidade retroativa)
      if (data.valor !== undefined && data.valor <= 0) {
        throw new Error('O valor deve ser maior que zero');
      }

      if (data.categoria) {
        const categoriasValidas = ['Despesa', 'Receita', 'Investimento'];
        if (!categoriasValidas.includes(data.categoria)) {
          throw new Error(`Categoria inválida. Use: ${categoriasValidas.join(', ')}`);
        }
      }

      // Criar prestação de contas
      const prestacao = await this.prestacaoContasRepository.create(data);

      console.log('[PRESTACAO CONTAS SERVICE] Prestação de contas criada:', prestacao.id);
      return prestacao;
    } catch (error) {
      console.error('[PRESTACAO CONTAS SERVICE] Erro ao criar prestação de contas:', error);
      throw error;
    }
  }

  /**
   * Busca todas as prestações de contas
   */
  async getAll(filters = {}) {
    try {
      console.log('[PRESTACAO CONTAS SERVICE] Buscando todas as prestações de contas');
      return await this.prestacaoContasRepository.findAll(filters);
    } catch (error) {
      console.error('[PRESTACAO CONTAS SERVICE] Erro ao buscar prestações:', error);
      throw error;
    }
  }

  /**
   * Busca prestação de contas por ID
   */
  async getById(id) {
    try {
      console.log('[PRESTACAO CONTAS SERVICE] Buscando prestação de contas por ID:', id);
      return await this.prestacaoContasRepository.findById(id);
    } catch (error) {
      console.error('[PRESTACAO CONTAS SERVICE] Erro ao buscar prestação:', error);
      throw error;
    }
  }

  /**
   * Busca prestações de contas por organização
   */
  async getByOrganization(organizationId, filters = {}) {
    try {
      console.log('[PRESTACAO CONTAS SERVICE] Buscando prestações da organização:', organizationId);
      return await this.prestacaoContasRepository.findByOrganizationId(organizationId, filters);
    } catch (error) {
      console.error('[PRESTACAO CONTAS SERVICE] Erro ao buscar prestações da organização:', error);
      throw error;
    }
  }

  /**
   * Busca prestações de contas por categoria
   */
  async getByCategory(categoria, filters = {}) {
    try {
      console.log('[PRESTACAO CONTAS SERVICE] Buscando prestações por categoria:', categoria);

      // Validar categoria
      const categoriasValidas = ['Despesa', 'Receita', 'Investimento'];
      if (!categoriasValidas.includes(categoria)) {
        throw new Error(`Categoria inválida. Use: ${categoriasValidas.join(', ')}`);
      }

      return await this.prestacaoContasRepository.findByCategory(categoria, filters);
    } catch (error) {
      console.error('[PRESTACAO CONTAS SERVICE] Erro ao buscar prestações por categoria:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma prestação de contas
   */
  async update(id, data) {
    try {
      console.log('[PRESTACAO CONTAS SERVICE] Atualizando prestação de contas:', id);

      // Validações de negócio para estrutura antiga (compatibilidade retroativa)
      if (data.valor !== undefined && data.valor <= 0) {
        throw new Error('O valor deve ser maior que zero');
      }

      if (data.categoria) {
        const categoriasValidas = ['Despesa', 'Receita', 'Investimento'];
        if (!categoriasValidas.includes(data.categoria)) {
          throw new Error(`Categoria inválida. Use: ${categoriasValidas.join(', ')}`);
        }
      }

      // Validações para nova estrutura
      if (
        data.colunas !== undefined &&
        (!Array.isArray(data.colunas) || data.colunas.length === 0)
      ) {
        throw new Error('Colunas deve ser um array não vazio');
      }

      if (data.linhas !== undefined && !Array.isArray(data.linhas)) {
        throw new Error('Linhas deve ser um array');
      }

      const prestacao = await this.prestacaoContasRepository.update(id, data);

      if (!prestacao) {
        throw new Error('Prestação de contas não encontrada');
      }

      console.log('[PRESTACAO CONTAS SERVICE] Prestação de contas atualizada:', id);
      return prestacao;
    } catch (error) {
      console.error('[PRESTACAO CONTAS SERVICE] Erro ao atualizar prestação:', error);
      throw error;
    }
  }

  /**
   * Deleta uma prestação de contas
   */
  async delete(id) {
    try {
      console.log('[PRESTACAO CONTAS SERVICE] Deletando prestação de contas:', id);

      const result = await this.prestacaoContasRepository.delete(id);

      if (!result) {
        throw new Error('Prestação de contas não encontrada');
      }

      console.log('[PRESTACAO CONTAS SERVICE] Prestação de contas deletada:', id);
      return result;
    } catch (error) {
      console.error('[PRESTACAO CONTAS SERVICE] Erro ao deletar prestação:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de prestação de contas
   */
  async getStatistics(organizationId, filters = {}) {
    try {
      console.log(
        '[PRESTACAO CONTAS SERVICE] Obtendo estatísticas da organização:',
        organizationId
      );
      return await this.prestacaoContasRepository.getStatistics(organizationId, filters);
    } catch (error) {
      console.error('[PRESTACAO CONTAS SERVICE] Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

module.exports = PrestacaoContasService;
