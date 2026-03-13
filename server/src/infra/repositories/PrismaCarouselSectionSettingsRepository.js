/**
 * REPOSITORY PATTERN - Implementacao Prisma para CarouselSectionSettings
 */

const PrismaService = require('../singletons/PrismaService');

class PrismaCarouselSectionSettingsRepository {
  constructor() {
    this.prismaService = PrismaService.getInstance();
    console.log('[PRISMA CAROUSEL SETTINGS REPOSITORY] Inicializado com sucesso');
  }

  _getPrismaClient() {
    return this.prismaService.getClient();
  }

  async findBySection(section = 'donations') {
    const prisma = this._getPrismaClient();
    return prisma.carouselSectionSettings.findUnique({ where: { section } });
  }

  async upsertBySection({ section = 'donations', title, subtitle }) {
    const prisma = this._getPrismaClient();
    return prisma.carouselSectionSettings.upsert({
      where: { section },
      create: { section, title, subtitle },
      update: { title, subtitle },
    });
  }
}

module.exports = PrismaCarouselSectionSettingsRepository;
