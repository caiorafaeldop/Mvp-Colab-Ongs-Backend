const PrismaService = require('../singletons/PrismaService');

/**
 * Repository para FAQ usando Prisma
 */
class PrismaFAQRepository {
  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  _getPrismaClient() {
    return this.prismaService.getClient();
  }

  /**
   * Cria uma nova pergunta
   */
  async create(data) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.fAQ.create({
        data,
      });
    } catch (error) {
      console.error('[PRISMA FAQ REPOSITORY] Erro ao criar:', error);
      throw error;
    }
  }

  /**
   * Busca todas as perguntas com filtros
   */
  async findAll(filters = {}) {
    try {
      const prisma = this._getPrismaClient();
      const { skip = 0, limit = 50, ativo } = filters;

      const where = {};
      if (ativo !== undefined) {
        where.ativo = ativo;
      }

      const [faqs, total] = await Promise.all([
        prisma.fAQ.findMany({
          where,
          orderBy: { ordem: 'asc' },
          skip,
          take: limit,
        }),
        prisma.fAQ.count({ where }),
      ]);

      return {
        data: faqs,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[PRISMA FAQ REPOSITORY] Erro ao buscar todas:', error);
      throw error;
    }
  }

  /**
   * Busca FAQ por ID
   */
  async findById(id) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.fAQ.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('[PRISMA FAQ REPOSITORY] Erro ao buscar por ID:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma FAQ
   */
  async update(id, data) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.fAQ.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return null;
      }
      console.error('[PRISMA FAQ REPOSITORY] Erro ao atualizar:', error);
      throw error;
    }
  }

  /**
   * Deleta uma FAQ
   */
  async delete(id) {
    try {
      const prisma = this._getPrismaClient();
      await prisma.fAQ.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false;
      }
      console.error('[PRISMA FAQ REPOSITORY] Erro ao deletar:', error);
      throw error;
    }
  }

  /**
   * Alterna status ativo/inativo
   */
  async toggleActive(id) {
    try {
      const prisma = this._getPrismaClient();
      const faq = await this.findById(id);
      if (!faq) {
        return null;
      }

      return await prisma.fAQ.update({
        where: { id },
        data: { ativo: !faq.ativo },
      });
    } catch (error) {
      console.error('[PRISMA FAQ REPOSITORY] Erro ao alternar status:', error);
      throw error;
    }
  }
}

module.exports = PrismaFAQRepository;
