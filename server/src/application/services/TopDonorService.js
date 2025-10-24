/**
 * SERVICE LAYER - Serviço de Doadores de Destaque
 * Contém a lógica de negócio para gerenciar doadores de destaque
 */

class TopDonorService {
  constructor(topDonorRepository) {
    this.topDonorRepository = topDonorRepository;
    console.log('[TOP DONOR SERVICE] Inicializado com sucesso');
  }

  /**
   * Cria um novo doador de destaque
   */
  async createTopDonor(data) {
    try {
      console.log('=== [TOP DONOR SERVICE] INÍCIO DO CREATE ===');
      console.log('[TOP DONOR SERVICE] Dados recebidos:', JSON.stringify(data, null, 2));

      // Validações
      console.log('[TOP DONOR SERVICE] Iniciando validações...');

      if (!data.donorName || data.donorName.trim() === '') {
        console.error('[TOP DONOR SERVICE] Validação falhou: Nome do doador vazio');
        throw new Error('Nome do doador é obrigatório');
      }
      console.log('[TOP DONOR SERVICE] ✓ donorName válido');

      // topPosition é opcional: será recalculado automaticamente após criação

      if (!data.donatedAmount || data.donatedAmount <= 0) {
        console.error(
          '[TOP DONOR SERVICE] Validação falhou: donatedAmount inválido:',
          data.donatedAmount
        );
        throw new Error('Valor doado deve ser maior que 0');
      }
      console.log('[TOP DONOR SERVICE] ✓ donatedAmount válido');

      if (!data.donationType || !['single', 'recurring', 'total'].includes(data.donationType)) {
        console.error(
          '[TOP DONOR SERVICE] Validação falhou: donationType inválido:',
          data.donationType
        );
        throw new Error('Tipo de doação inválido. Use: single, recurring ou total');
      }
      console.log('[TOP DONOR SERVICE] ✓ donationType válido');

      if (!data.donationDate) {
        console.error('[TOP DONOR SERVICE] Validação falhou: donationDate ausente');
        throw new Error('Data da doação é obrigatória');
      }
      console.log('[TOP DONOR SERVICE] ✓ donationDate válido');

      if (!data.referenceMonth || data.referenceMonth < 1 || data.referenceMonth > 12) {
        console.error(
          '[TOP DONOR SERVICE] Validação falhou: referenceMonth inválido:',
          data.referenceMonth
        );
        throw new Error('Mês de referência inválido (1-12)');
      }
      console.log('[TOP DONOR SERVICE] ✓ referenceMonth válido');

      if (!data.referenceYear || data.referenceYear < 2000) {
        console.error(
          '[TOP DONOR SERVICE] Validação falhou: referenceYear inválido:',
          data.referenceYear
        );
        throw new Error('Ano de referência inválido');
      }
      console.log('[TOP DONOR SERVICE] ✓ referenceYear válido');

      console.log('[TOP DONOR SERVICE] Todas as validações passaram!');

      // Prepara dados para criação
      const createData = {
        donorName: data.donorName.trim(),
        topPosition: data.topPosition !== undefined ? Number(data.topPosition) : 9999,
        donatedAmount: Number(data.donatedAmount),
        donationType: data.donationType,
        donationDate: new Date(data.donationDate),
        organizationId: data.organizationId || null,
        organizationName: data.organizationName || null,
        referenceMonth: Number(data.referenceMonth),
        referenceYear: Number(data.referenceYear),
        metadata: data.metadata || {},
      };

      console.log(
        '[TOP DONOR SERVICE] Dados preparados para o repository:',
        JSON.stringify(createData, null, 2)
      );
      console.log('[TOP DONOR SERVICE] Chamando topDonorRepository.create...');

      const topDonor = await this.topDonorRepository.create(createData);

      // Após criar, recalcula ranking do período com base no valor doado (desc)
      await this._recomputeRankingForPeriod(createData.referenceMonth, createData.referenceYear);

      console.log('[TOP DONOR SERVICE] Repository retornou:', topDonor);
      console.log('[TOP DONOR SERVICE] Doador de destaque criado com sucesso, ID:', topDonor.id);
      console.log('=== [TOP DONOR SERVICE] FIM DO CREATE (SUCESSO) ===');

      return topDonor;
    } catch (error) {
      console.error('=== [TOP DONOR SERVICE] ERRO NO CREATE ===');
      console.error('[TOP DONOR SERVICE] Tipo do erro:', error.constructor.name);
      console.error('[TOP DONOR SERVICE] Mensagem:', error.message);
      console.error('[TOP DONOR SERVICE] Stack:', error.stack);
      console.error('=== [TOP DONOR SERVICE] FIM DO ERRO ===');
      throw error;
    }
  }

  /**
   * Lista todos os doadores de destaque com filtros
   */
  async listTopDonors(filters = {}) {
    try {
      console.log('[TOP DONOR SERVICE] Listando doadores de destaque:', filters);

      const result = await this.topDonorRepository.findAll(filters);

      console.log(`[TOP DONOR SERVICE] ${result.data.length} doadores encontrados`);
      return result;
    } catch (error) {
      console.error('[TOP DONOR SERVICE] Erro ao listar doadores de destaque:', error);
      throw error;
    }
  }

  /**
   * Busca um doador de destaque por ID
   */
  async getTopDonorById(id) {
    try {
      console.log('[TOP DONOR SERVICE] Buscando doador de destaque por ID:', id);

      if (!id) {
        throw new Error('ID é obrigatório');
      }

      const topDonor = await this.topDonorRepository.findById(id);

      if (!topDonor) {
        throw new Error('Doador de destaque não encontrado');
      }

      console.log('[TOP DONOR SERVICE] Doador de destaque encontrado:', topDonor.id);
      return topDonor;
    } catch (error) {
      console.error('[TOP DONOR SERVICE] Erro ao buscar doador de destaque:', error);
      throw error;
    }
  }

  /**
   * Busca doadores de destaque por período
   */
  async getTopDonorsByPeriod(month, year) {
    try {
      console.log(`[TOP DONOR SERVICE] Buscando doadores do período ${month}/${year}`);

      if (!month || month < 1 || month > 12) {
        throw new Error('Mês inválido (1-12)');
      }

      if (!year || year < 2000) {
        throw new Error('Ano inválido');
      }

      const topDonors = await this.topDonorRepository.findByPeriod(month, year);

      console.log(`[TOP DONOR SERVICE] ${topDonors.length} doadores encontrados para o período`);
      return topDonors;
    } catch (error) {
      console.error('[TOP DONOR SERVICE] Erro ao buscar por período:', error);
      throw error;
    }
  }

  /**
   * Busca doadores de destaque por organização
   */
  async getTopDonorsByOrganization(organizationId) {
    try {
      console.log('[TOP DONOR SERVICE] Buscando doadores por organização:', organizationId);

      if (!organizationId) {
        throw new Error('ID da organização é obrigatório');
      }

      const topDonors = await this.topDonorRepository.findByOrganization(organizationId);

      console.log(
        `[TOP DONOR SERVICE] ${topDonors.length} doadores encontrados para a organização`
      );
      return topDonors;
    } catch (error) {
      console.error('[TOP DONOR SERVICE] Erro ao buscar por organização:', error);
      throw error;
    }
  }

  /**
   * Busca o top N doadores de um período
   */
  async getTopN(month, year, limit = 10) {
    try {
      console.log(`[TOP DONOR SERVICE] Buscando top ${limit} doadores de ${month}/${year}`);

      if (!month || month < 1 || month > 12) {
        throw new Error('Mês inválido (1-12)');
      }

      if (!year || year < 2000) {
        throw new Error('Ano inválido');
      }

      if (limit < 1 || limit > 100) {
        throw new Error('Limite deve estar entre 1 e 100');
      }

      const topDonors = await this.topDonorRepository.findTopN(month, year, limit);

      console.log(`[TOP DONOR SERVICE] Top ${limit} encontrados`);
      return topDonors;
    } catch (error) {
      console.error('[TOP DONOR SERVICE] Erro ao buscar top N:', error);
      throw error;
    }
  }

  /**
   * Atualiza um doador de destaque
   */
  async updateTopDonor(id, data) {
    try {
      console.log('[TOP DONOR SERVICE] Atualizando doador de destaque:', id);

      if (!id) {
        throw new Error('ID é obrigatório');
      }

      // Verifica se existe
      const existing = await this.topDonorRepository.findById(id);
      if (!existing) {
        throw new Error('Doador de destaque não encontrado');
      }

      // Validações dos campos a serem atualizados
      if (data.donorName !== undefined && data.donorName.trim() === '') {
        throw new Error('Nome do doador não pode ser vazio');
      }

      if (data.topPosition !== undefined && data.topPosition < 1) {
        throw new Error('Posição no top deve ser maior que 0');
      }

      if (data.donatedAmount !== undefined && data.donatedAmount <= 0) {
        throw new Error('Valor doado deve ser maior que 0');
      }

      if (
        data.donationType !== undefined &&
        !['single', 'recurring', 'total'].includes(data.donationType)
      ) {
        throw new Error('Tipo de doação inválido. Use: single, recurring ou total');
      }

      if (
        data.referenceMonth !== undefined &&
        (data.referenceMonth < 1 || data.referenceMonth > 12)
      ) {
        throw new Error('Mês de referência inválido (1-12)');
      }

      if (data.referenceYear !== undefined && data.referenceYear < 2000) {
        throw new Error('Ano de referência inválido');
      }

      // Prepara dados para atualização
      const updateData = {};
      if (data.donorName !== undefined) {
        updateData.donorName = data.donorName.trim();
      }
      if (data.topPosition !== undefined) {
        updateData.topPosition = Number(data.topPosition);
      }
      if (data.donatedAmount !== undefined) {
        updateData.donatedAmount = Number(data.donatedAmount);
      }
      if (data.donationType !== undefined) {
        updateData.donationType = data.donationType;
      }
      if (data.donationDate !== undefined) {
        updateData.donationDate = new Date(data.donationDate);
      }
      if (data.organizationId !== undefined) {
        updateData.organizationId = data.organizationId;
      }
      if (data.organizationName !== undefined) {
        updateData.organizationName = data.organizationName;
      }
      if (data.referenceMonth !== undefined) {
        updateData.referenceMonth = Number(data.referenceMonth);
      }
      if (data.referenceYear !== undefined) {
        updateData.referenceYear = Number(data.referenceYear);
      }
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata;
      }

      const topDonor = await this.topDonorRepository.update(id, updateData);

      // Determina período afetado para recalcular ranking
      const month =
        updateData.referenceMonth !== undefined
          ? updateData.referenceMonth
          : existing.referenceMonth;
      const year =
        updateData.referenceYear !== undefined ? updateData.referenceYear : existing.referenceYear;
      await this._recomputeRankingForPeriod(month, year);

      console.log('[TOP DONOR SERVICE] Doador de destaque atualizado com sucesso:', id);
      return topDonor;
    } catch (error) {
      console.error('[TOP DONOR SERVICE] Erro ao atualizar doador de destaque:', error);
      throw error;
    }
  }

  /**
   * Deleta um doador de destaque
   */
  async deleteTopDonor(id) {
    try {
      console.log('[TOP DONOR SERVICE] Deletando doador de destaque:', id);

      if (!id) {
        throw new Error('ID é obrigatório');
      }

      // Verifica se existe
      const existing = await this.topDonorRepository.findById(id);
      if (!existing) {
        throw new Error('Doador de destaque não encontrado');
      }

      // Captura período antes de deletar para recomputar
      const month = existing.referenceMonth;
      const year = existing.referenceYear;

      await this.topDonorRepository.delete(id);

      // Recalcula ranking após exclusão
      await this._recomputeRankingForPeriod(month, year);

      console.log('[TOP DONOR SERVICE] Doador de destaque deletado com sucesso:', id);
      return { success: true, message: 'Doador de destaque deletado com sucesso' };
    } catch (error) {
      console.error('[TOP DONOR SERVICE] Erro ao deletar doador de destaque:', error);
      throw error;
    }
  }

  /**
   * Deleta todos os doadores de um período
   */
  async deleteTopDonorsByPeriod(month, year) {
    try {
      console.log(`[TOP DONOR SERVICE] Deletando doadores do período ${month}/${year}`);

      if (!month || month < 1 || month > 12) {
        throw new Error('Mês inválido (1-12)');
      }

      if (!year || year < 2000) {
        throw new Error('Ano inválido');
      }

      const count = await this.topDonorRepository.deleteByPeriod(month, year);

      console.log(`[TOP DONOR SERVICE] ${count} doadores deletados do período`);
      return { success: true, message: `${count} doadores deletados com sucesso`, count };
    } catch (error) {
      console.error('[TOP DONOR SERVICE] Erro ao deletar por período:', error);
      throw error;
    }
  }
}

/**
 * Métodos privados auxiliares
 */
TopDonorService.prototype._recomputeRankingForPeriod = async function (month, year) {
  try {
    const list = await this.topDonorRepository.findByPeriodOrderByAmount(month, year);
    let pos = 1;
    for (const item of list) {
      // Atualiza a posição apenas se mudou
      if (item.topPosition !== pos) {
        await this.topDonorRepository.updatePosition(item.id, pos);
      }
      pos += 1;
    }
  } catch (error) {
    console.error('[TOP DONOR SERVICE] Erro ao recalcular ranking:', error);
    // Não propaga para não quebrar a operação primária
  }
};

module.exports = TopDonorService;
