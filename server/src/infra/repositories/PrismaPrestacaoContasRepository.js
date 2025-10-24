/**
 * REPOSITORY PATTERN - Implementação Prisma para Prestação de Contas
 * Usa o Prisma que já está configurado no projeto
 */

const PrismaService = require('../singletons/PrismaService');

class PrismaPrestacaoContasRepository {
  constructor() {
    this.prismaService = PrismaService.getInstance();
    console.log('[PRISMA PRESTACAO CONTAS REPOSITORY] Inicializado com sucesso');
  }

  /**
   * Cria uma nova prestação de contas
   */
  async create(data) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.prestacaoContas.create({
        data,
      });
    } catch (error) {
      console.error('[PRISMA PRESTACAO CONTAS REPOSITORY] Erro ao criar:', error);
      throw error;
    }
  }

  /**
   * Busca todas as prestações de contas com filtros
   */
  async findAll(filters = {}) {
    try {
      const prisma = this._getPrismaClient();
      const { skip = 0, limit = 20, categoria, organizationId } = filters;

      const where = {};
      if (categoria) {
        where.categoria = categoria;
      }
      if (organizationId) {
        where.organizationId = organizationId;
      }

      const [prestacoes, total] = await Promise.all([
        prisma.prestacaoContas.findMany({
          where,
          orderBy: { data: 'desc' },
          skip,
          take: limit,
        }),
        prisma.prestacaoContas.count({ where }),
      ]);

      return {
        data: prestacoes,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[PRISMA PRESTACAO CONTAS REPOSITORY] Erro ao buscar todas:', error);
      throw error;
    }
  }

  /**
   * Busca prestação de contas por ID
   */
  async findById(id) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.prestacaoContas.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('[PRISMA PRESTACAO CONTAS REPOSITORY] Erro ao buscar por ID:', error);
      throw error;
    }
  }

  /**
   * Busca prestações de contas por organização
   */
  async findByOrganizationId(organizationId, filters = {}) {
    try {
      const prisma = this._getPrismaClient();
      const { skip = 0, limit = 20, categoria, startDate, endDate } = filters;

      const where = { organizationId };

      if (categoria) {
        where.categoria = categoria;
      }

      if (startDate || endDate) {
        where.data = {};
        if (startDate) {
          where.data.gte = new Date(startDate);
        }
        if (endDate) {
          where.data.lte = new Date(endDate);
        }
      }

      const [prestacoes, total] = await Promise.all([
        prisma.prestacaoContas.findMany({
          where,
          orderBy: { data: 'desc' },
          skip,
          take: limit,
        }),
        prisma.prestacaoContas.count({ where }),
      ]);

      return {
        data: prestacoes,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[PRISMA PRESTACAO CONTAS REPOSITORY] Erro ao buscar por organização:', error);
      throw error;
    }
  }

  /**
   * Busca prestações de contas por categoria
   */
  async findByCategory(categoria, filters = {}) {
    try {
      const prisma = this._getPrismaClient();
      const { skip = 0, limit = 20, organizationId } = filters;

      const where = { categoria };
      if (organizationId) {
        where.organizationId = organizationId;
      }

      const [prestacoes, total] = await Promise.all([
        prisma.prestacaoContas.findMany({
          where,
          orderBy: { data: 'desc' },
          skip,
          take: limit,
        }),
        prisma.prestacaoContas.count({ where }),
      ]);

      return {
        data: prestacoes,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[PRISMA PRESTACAO CONTAS REPOSITORY] Erro ao buscar por categoria:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma prestação de contas
   */
  async update(id, data) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.prestacaoContas.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return null;
      }
      console.error('[PRISMA PRESTACAO CONTAS REPOSITORY] Erro ao atualizar:', error);
      throw error;
    }
  }

  /**
   * Deleta uma prestação de contas
   */
  async delete(id) {
    try {
      const prisma = this._getPrismaClient();
      await prisma.prestacaoContas.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false;
      }
      console.error('[PRISMA PRESTACAO CONTAS REPOSITORY] Erro ao deletar:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de prestação de contas por organização
   */
  async getStatistics(organizationId, filters = {}) {
    try {
      const prisma = this._getPrismaClient();
      const { startDate, endDate } = filters;

      const where = { organizationId };

      if (startDate || endDate) {
        where.data = {};
        if (startDate) {
          where.data.gte = new Date(startDate);
        }
        if (endDate) {
          where.data.lte = new Date(endDate);
        }
      }

      const [totalDespesas, totalReceitas, totalInvestimentos, count] = await Promise.all([
        prisma.prestacaoContas.aggregate({
          where: { ...where, categoria: 'Despesa' },
          _sum: { valor: true },
        }),
        prisma.prestacaoContas.aggregate({
          where: { ...where, categoria: 'Receita' },
          _sum: { valor: true },
        }),
        prisma.prestacaoContas.aggregate({
          where: { ...where, categoria: 'Investimento' },
          _sum: { valor: true },
        }),
        prisma.prestacaoContas.count({ where }),
      ]);

      return {
        totalDespesas: totalDespesas._sum.valor || 0,
        totalReceitas: totalReceitas._sum.valor || 0,
        totalInvestimentos: totalInvestimentos._sum.valor || 0,
        saldo: (totalReceitas._sum.valor || 0) - (totalDespesas._sum.valor || 0),
        totalRegistros: count,
      };
    } catch (error) {
      console.error('[PRISMA PRESTACAO CONTAS REPOSITORY] Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  _getPrismaClient() {
    if (!this.prismaService.isReady()) {
      throw new Error('PrismaService não está inicializado. Chame initialize() primeiro.');
    }
    return this.prismaService.getClient();
  }
}

module.exports = PrismaPrestacaoContasRepository;
