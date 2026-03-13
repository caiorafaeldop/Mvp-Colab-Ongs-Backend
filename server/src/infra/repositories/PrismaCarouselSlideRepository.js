/**
 * REPOSITORY PATTERN - Implementacao Prisma para CarouselSlide
 */

const PrismaService = require('../singletons/PrismaService');

class PrismaCarouselSlideRepository {
  constructor() {
    this.prismaService = PrismaService.getInstance();
    console.log('[PRISMA CAROUSEL SLIDE REPOSITORY] Inicializado com sucesso');
  }

  _getPrismaClient() {
    return this.prismaService.getClient();
  }

  async create(data) {
    const prisma = this._getPrismaClient();
    const payload = {
      imageUrl: data.imageUrl,
      caption: data.caption || null,
      altText: data.altText || null,
      order: data.order ?? 0,
      visible: data.visible ?? true,
    };

    return prisma.carouselSlide.create({ data: payload });
  }

  async findAll({ visible } = {}) {
    const prisma = this._getPrismaClient();
    const where = {};

    if (typeof visible === 'boolean') {
      where.visible = visible;
    }

    return prisma.carouselSlide.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findPublic() {
    const prisma = this._getPrismaClient();
    return prisma.carouselSlide.findMany({
      where: { visible: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id) {
    const prisma = this._getPrismaClient();
    return prisma.carouselSlide.findUnique({ where: { id } });
  }

  async update(id, data) {
    const prisma = this._getPrismaClient();
    const updateData = {};

    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl;
    }
    if (data.caption !== undefined) {
      updateData.caption = data.caption;
    }
    if (data.altText !== undefined) {
      updateData.altText = data.altText;
    }
    if (data.order !== undefined) {
      updateData.order = Number(data.order);
    }
    if (data.visible !== undefined) {
      updateData.visible = !!data.visible;
    }

    try {
      return await prisma.carouselSlide.update({ where: { id }, data: updateData });
    } catch (error) {
      if (error && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  async delete(id) {
    const prisma = this._getPrismaClient();

    try {
      await prisma.carouselSlide.delete({ where: { id } });
      return true;
    } catch (error) {
      if (error && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }
}

module.exports = PrismaCarouselSlideRepository;
