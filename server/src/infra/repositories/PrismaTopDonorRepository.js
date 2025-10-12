/**
 * REPOSITORY PATTERN - Implementação Prisma para TopDonor
 * Gerencia operações de dados para doadores de destaque
 */

const PrismaService = require('../singletons/PrismaService');

class PrismaTopDonorRepository {
  constructor() {
    this.prismaService = PrismaService.getInstance();
    console.log('[PRISMA TOP DONOR REPOSITORY] Inicializado com sucesso');
  }

  /**
   * Obtém o cliente Prisma
   */
  _getPrismaClient() {
    return this.prismaService.getClient();
  }

  /**
   * Cria um novo doador de destaque
   */
  async create(data) {
    try {
      console.log('=== [PRISMA TOP DONOR REPOSITORY] INÍCIO DO CREATE ===');
      console.log('[PRISMA TOP DONOR REPOSITORY] Dados recebidos:', JSON.stringify(data, null, 2));

      console.log('[PRISMA TOP DONOR REPOSITORY] Obtendo Prisma Client...');
      const prisma = this._getPrismaClient();
      console.log('[PRISMA TOP DONOR REPOSITORY] Prisma Client obtido:', !!prisma);

      const createPayload = {
        donorName: data.donorName,
        topPosition: data.topPosition,
        donatedAmount: data.donatedAmount,
        donationType: data.donationType,
        donationDate: data.donationDate,
        organizationId: data.organizationId || null,
        organizationName: data.organizationName || null,
        referenceMonth: data.referenceMonth,
        referenceYear: data.referenceYear,
        metadata: data.metadata || {},
      };

      console.log(
        '[PRISMA TOP DONOR REPOSITORY] Payload para Prisma:',
        JSON.stringify(createPayload, null, 2)
      );
      console.log('[PRISMA TOP DONOR REPOSITORY] Executando prisma.topDonor.create...');

      const topDonor = await prisma.topDonor.create({
        data: createPayload,
      });

      console.log('[PRISMA TOP DONOR REPOSITORY] Doador criado com sucesso!');
      console.log('[PRISMA TOP DONOR REPOSITORY] ID:', topDonor.id);
      console.log(
        '[PRISMA TOP DONOR REPOSITORY] Dados completos:',
        JSON.stringify(topDonor, null, 2)
      );
      console.log('=== [PRISMA TOP DONOR REPOSITORY] FIM DO CREATE (SUCESSO) ===');

      return topDonor;
    } catch (error) {
      console.error('=== [PRISMA TOP DONOR REPOSITORY] ERRO NO CREATE ===');
      console.error('[PRISMA TOP DONOR REPOSITORY] Tipo do erro:', error.constructor.name);
      console.error('[PRISMA TOP DONOR REPOSITORY] Mensagem:', error.message);
      console.error('[PRISMA TOP DONOR REPOSITORY] Code:', error.code);
      console.error('[PRISMA TOP DONOR REPOSITORY] Meta:', error.meta);
      console.error('[PRISMA TOP DONOR REPOSITORY] Stack:', error.stack);
      console.error('=== [PRISMA TOP DONOR REPOSITORY] FIM DO ERRO ===');
      throw error;
    }
  }

  /**
   * Busca todos os doadores de destaque com filtros
   */
  async findAll(filters = {}) {
    try {
      const prisma = this._getPrismaClient();
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 20;
      const skip = (page - 1) * limit;

      const where = {};

      // Filtro por ano
      if (filters.year) {
        where.referenceYear = Number(filters.year);
      }

      // Filtro por mês
      if (filters.month) {
        where.referenceMonth = Number(filters.month);
      }

      // Filtro por organização
      if (filters.organizationId) {
        where.organizationId = filters.organizationId;
      }

      // Filtro por tipo de doação
      if (filters.donationType) {
        where.donationType = filters.donationType;
      }

      const [topDonors, total] = await Promise.all([
        prisma.topDonor.findMany({
          where,
          orderBy: { topPosition: 'asc' },
          skip,
          take: limit,
        }),
        prisma.topDonor.count({ where }),
      ]);

      return {
        data: topDonors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[PRISMA TOP DONOR REPOSITORY] Erro ao buscar doadores de destaque:', error);
      throw error;
    }
  }

  /**
   * Busca um doador de destaque por ID
   */
  async findById(id) {
    try {
      const prisma = this._getPrismaClient();

      const topDonor = await prisma.topDonor.findUnique({
        where: { id },
      });

      if (!topDonor) {
        console.log('[PRISMA TOP DONOR REPOSITORY] Doador de destaque não encontrado:', id);
        return null;
      }

      console.log('[PRISMA TOP DONOR REPOSITORY] Doador de destaque encontrado:', id);
      return topDonor;
    } catch (error) {
      console.error(
        '[PRISMA TOP DONOR REPOSITORY] Erro ao buscar doador de destaque por ID:',
        error
      );
      throw error;
    }
  }

  /**
   * Busca doadores de destaque por período (mês/ano)
   */
  async findByPeriod(month, year) {
    try {
      const prisma = this._getPrismaClient();

      const topDonors = await prisma.topDonor.findMany({
        where: {
          referenceMonth: Number(month),
          referenceYear: Number(year),
        },
        orderBy: { topPosition: 'asc' },
      });

      console.log(
        `[PRISMA TOP DONOR REPOSITORY] Encontrados ${topDonors.length} doadores para ${month}/${year}`
      );
      return topDonors;
    } catch (error) {
      console.error('[PRISMA TOP DONOR REPOSITORY] Erro ao buscar por período:', error);
      throw error;
    }
  }

  /**
   * Busca doadores de destaque por organização
   */
  async findByOrganization(organizationId) {
    try {
      const prisma = this._getPrismaClient();

      const topDonors = await prisma.topDonor.findMany({
        where: { organizationId },
        orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }, { topPosition: 'asc' }],
      });

      console.log(
        `[PRISMA TOP DONOR REPOSITORY] Encontrados ${topDonors.length} doadores para organização ${organizationId}`
      );
      return topDonors;
    } catch (error) {
      console.error('[PRISMA TOP DONOR REPOSITORY] Erro ao buscar por organização:', error);
      throw error;
    }
  }

  /**
   * Atualiza um doador de destaque
   */
  async update(id, data) {
    try {
      const prisma = this._getPrismaClient();

      const updateData = {};

      if (data.donorName !== undefined) {
        updateData.donorName = data.donorName;
      }
      if (data.topPosition !== undefined) {
        updateData.topPosition = data.topPosition;
      }
      if (data.donatedAmount !== undefined) {
        updateData.donatedAmount = data.donatedAmount;
      }
      if (data.donationType !== undefined) {
        updateData.donationType = data.donationType;
      }
      if (data.donationDate !== undefined) {
        updateData.donationDate = data.donationDate;
      }
      if (data.organizationId !== undefined) {
        updateData.organizationId = data.organizationId;
      }
      if (data.organizationName !== undefined) {
        updateData.organizationName = data.organizationName;
      }
      if (data.referenceMonth !== undefined) {
        updateData.referenceMonth = data.referenceMonth;
      }
      if (data.referenceYear !== undefined) {
        updateData.referenceYear = data.referenceYear;
      }
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata;
      }

      const topDonor = await prisma.topDonor.update({
        where: { id },
        data: updateData,
      });

      console.log('[PRISMA TOP DONOR REPOSITORY] Doador de destaque atualizado:', id);
      return topDonor;
    } catch (error) {
      console.error('[PRISMA TOP DONOR REPOSITORY] Erro ao atualizar doador de destaque:', error);
      throw error;
    }
  }

  /**
   * Deleta um doador de destaque
   */
  async delete(id) {
    try {
      const prisma = this._getPrismaClient();

      await prisma.topDonor.delete({
        where: { id },
      });

      console.log('[PRISMA TOP DONOR REPOSITORY] Doador de destaque deletado:', id);
      return true;
    } catch (error) {
      console.error('[PRISMA TOP DONOR REPOSITORY] Erro ao deletar doador de destaque:', error);
      throw error;
    }
  }

  /**
   * Deleta todos os doadores de um período específico
   */
  async deleteByPeriod(month, year) {
    try {
      const prisma = this._getPrismaClient();

      const result = await prisma.topDonor.deleteMany({
        where: {
          referenceMonth: Number(month),
          referenceYear: Number(year),
        },
      });

      console.log(
        `[PRISMA TOP DONOR REPOSITORY] Deletados ${result.count} doadores do período ${month}/${year}`
      );
      return result.count;
    } catch (error) {
      console.error('[PRISMA TOP DONOR REPOSITORY] Erro ao deletar por período:', error);
      throw error;
    }
  }

  /**
   * Busca o top N doadores de um período
   */
  async findTopN(month, year, limit = 10) {
    try {
      const prisma = this._getPrismaClient();

      const topDonors = await prisma.topDonor.findMany({
        where: {
          referenceMonth: Number(month),
          referenceYear: Number(year),
        },
        orderBy: { topPosition: 'asc' },
        take: limit,
      });

      console.log(
        `[PRISMA TOP DONOR REPOSITORY] Top ${limit} doadores encontrados para ${month}/${year}`
      );
      return topDonors;
    } catch (error) {
      console.error('[PRISMA TOP DONOR REPOSITORY] Erro ao buscar top N:', error);
      throw error;
    }
  }
}

module.exports = PrismaTopDonorRepository;
