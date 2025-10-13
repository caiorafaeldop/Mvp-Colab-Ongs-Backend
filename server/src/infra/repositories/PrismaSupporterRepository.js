/**
 * REPOSITORY PATTERN - Implementação Prisma para Supporter
 */

const PrismaService = require('../singletons/PrismaService');

class PrismaSupporterRepository {
  constructor() {
    this.prismaService = PrismaService.getInstance();
    console.log('[PRISMA SUPPORTER REPOSITORY] Inicializado com sucesso');
  }

  _getPrismaClient() {
    return this.prismaService.getClient();
  }

  async create(data) {
    const prisma = this._getPrismaClient();
    const payload = {
      name: data.name,
      imageUrl: data.imageUrl || null,
      description: data.description || null,
      website: data.website || null,
      order: data.order ?? 0,
      visible: data.visible ?? true,
    };
    return prisma.supporter.create({ data: payload });
  }

  async findAll({ page = 1, limit = 20, search, visible } = {}) {
    const prisma = this._getPrismaClient();
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};
    if (typeof visible === 'boolean') {
      where.visible = visible;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.supporter.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: Number(limit),
      }),
      prisma.supporter.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async findPublic() {
    const prisma = this._getPrismaClient();
    return prisma.supporter.findMany({
      where: { visible: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id) {
    const prisma = this._getPrismaClient();
    return prisma.supporter.findUnique({ where: { id } });
  }

  async update(id, data) {
    const prisma = this._getPrismaClient();
    const updateData = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.website !== undefined) {
      updateData.website = data.website;
    }
    if (data.order !== undefined) {
      updateData.order = Number(data.order);
    }
    if (data.visible !== undefined) {
      updateData.visible = !!data.visible;
    }

    return prisma.supporter.update({ where: { id }, data: updateData });
  }

  async delete(id) {
    const prisma = this._getPrismaClient();
    await prisma.supporter.delete({ where: { id } });
    return true;
  }
}

module.exports = PrismaSupporterRepository;
