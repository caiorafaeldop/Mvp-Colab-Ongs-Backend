require('dotenv').config();

const PrismaService = require('../src/infra/singletons/PrismaService');
const PrismaCarouselSlideRepository = require('../src/infra/repositories/PrismaCarouselSlideRepository');
const CarouselSlideService = require('../src/application/services/CarouselSlideService');

async function run() {
  const prismaService = PrismaService.getInstance();

  try {
    console.log('[CAROUSEL SEED] Inicializando Prisma...');
    await prismaService.initialize({ log: ['error'] });

    const repository = new PrismaCarouselSlideRepository();
    const service = new CarouselSlideService(repository);

    console.log('[CAROUSEL SEED] Importando slides padrao...');
    const result = await service.importDefaultSlides();

    console.log('[CAROUSEL SEED] Concluido com sucesso:', result);
  } catch (error) {
    console.error('[CAROUSEL SEED] Erro ao importar slides:', error);
    process.exitCode = 1;
  } finally {
    await prismaService.disconnect();
  }
}

run();
