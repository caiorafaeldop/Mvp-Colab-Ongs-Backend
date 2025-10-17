const PrismaService = require('../singletons/PrismaService');

/**
 * Repository para Testimonials usando Prisma
 */
class PrismaTestimonialRepository {
  constructor() {
    this.prismaService = PrismaService.getInstance();
  }

  _getPrismaClient() {
    return this.prismaService.getClient();
  }

  /**
   * Cria um novo depoimento
   */
  async create(data) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.testimonial.create({
        data,
      });
    } catch (error) {
      console.error('[PRISMA TESTIMONIAL REPOSITORY] Erro ao criar:', error);
      throw error;
    }
  }

  /**
   * Busca todos os depoimentos com filtros
   */
  async findAll(filters = {}) {
    try {
      const prisma = this._getPrismaClient();
      const { skip = 0, limit = 50, ativo } = filters;

      const where = {};
      if (ativo !== undefined) {
        where.ativo = ativo;
      }

      const [testimonials, total] = await Promise.all([
        prisma.testimonial.findMany({
          where,
          orderBy: { ordem: 'asc' },
          skip,
          take: limit,
        }),
        prisma.testimonial.count({ where }),
      ]);

      return {
        data: testimonials,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[PRISMA TESTIMONIAL REPOSITORY] Erro ao buscar todos:', error);
      throw error;
    }
  }

  /**
   * Busca depoimento por ID
   */
  async findById(id) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.testimonial.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('[PRISMA TESTIMONIAL REPOSITORY] Erro ao buscar por ID:', error);
      throw error;
    }
  }

  /**
   * Atualiza um depoimento
   */
  async update(id, data) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.testimonial.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return null;
      }
      console.error('[PRISMA TESTIMONIAL REPOSITORY] Erro ao atualizar:', error);
      throw error;
    }
  }

  /**
   * Deleta um depoimento
   */
  async delete(id) {
    try {
      const prisma = this._getPrismaClient();
      await prisma.testimonial.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false;
      }
      console.error('[PRISMA TESTIMONIAL REPOSITORY] Erro ao deletar:', error);
      throw error;
    }
  }

  /**
   * Alterna status ativo/inativo
   */
  async toggleActive(id) {
    try {
      const prisma = this._getPrismaClient();
      const testimonial = await this.findById(id);
      if (!testimonial) {
        return null;
      }

      return await prisma.testimonial.update({
        where: { id },
        data: { ativo: !testimonial.ativo },
      });
    } catch (error) {
      console.error('[PRISMA TESTIMONIAL REPOSITORY] Erro ao alternar status:', error);
      throw error;
    }
  }
}

module.exports = PrismaTestimonialRepository;
