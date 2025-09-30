/**
 * REPOSITORY PATTERN - Implementação Prisma para doações
 * Usa o Prisma que já está configurado no projeto
 */

// Interface removida na limpeza
const PrismaService = require('../singletons/PrismaService');

class PrismaDonationRepository {
  constructor() {
    // super() removido na limpeza
    this.prismaService = PrismaService.getInstance();
    console.log('[PRISMA DONATION REPOSITORY] Inicializado com sucesso');
  }

  async findByOrganizationId(organizationId, filters = {}) {
    try {
      const prisma = this._getPrismaClient();
      const page = Number(filters.page) || 1;
      const limit = Number(filters.limit) || 20;
      const skip = (page - 1) * limit;

      const where = { organizationId };
      if (filters.status) {
        where.paymentStatus = filters.status;
      }

      const [donations, total] = await Promise.all([
        prisma.donation.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.donation.count({ where }),
      ]);

      return {
        data: donations,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar por organização:', error);
      throw error;
    }
  }

  async findByStatus(status) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.donation.findMany({
        where: { paymentStatus: status },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar por status:', error);
      throw error;
    }
  }

  async findByType(type) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.donation.findMany({ where: { type }, orderBy: { createdAt: 'desc' } });
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar por tipo:', error);
      throw error;
    }
  }

  async findByDonorEmail(donorEmail) {
    try {
      const prisma = this._getPrismaClient();
      return await prisma.donation.findMany({
        where: { donorEmail },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar por email do doador:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const prisma = this._getPrismaClient();
      await prisma.donation.delete({ where: { id } });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false;
      }
      console.error('[PRISMA DONATION REPOSITORY] Erro ao remover doação:', error);
      throw error;
    }
  }

  _getPrismaClient() {
    if (!this.prismaService.isReady()) {
      throw new Error('PrismaService não está inicializado. Chame initialize() primeiro.');
    }
    return this.prismaService.getClient();
  }

  async create(donationData) {
    try {
      const prisma = this._getPrismaClient();
      const donation = await prisma.donation.create({
        data: {
          amount: donationData.amount,
          currency: donationData.currency || 'BRL',
          type: donationData.type || 'single',
          frequency: donationData.frequency,
          message: donationData.message,
          donorName: donationData.donorName,
          donorEmail: donationData.donorEmail,
          donorPhone: donationData.donorPhone,
          donorDocument: donationData.donorDocument,
          donorAddress: donationData.donorAddress,
          donorCity: donationData.donorCity,
          donorState: donationData.donorState,
          donorZipCode: donationData.donorZipCode,
          mercadoPagoId: donationData.mercadoPagoId,
          subscriptionId: donationData.subscriptionId,
          paymentStatus: donationData.paymentStatus || 'pending',
          paymentMethod: donationData.paymentMethod,
          isAnonymous: donationData.isAnonymous || false,
          showInPublicList: donationData.showInPublicList !== false,
          metadata: donationData.metadata || {},
        },
      });

      console.log('[PRISMA DONATION REPOSITORY] Doação criada:', donation.id);
      return donation;
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao criar doação:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const prisma = this._getPrismaClient();
      const donation = await prisma.donation.findUnique({
        where: { id },
      });

      return donation;
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar doação por ID:', error);
      throw error;
    }
  }

  async findByMercadoPagoId(mercadoPagoId) {
    try {
      const prisma = this._getPrismaClient();
      const donation = await prisma.donation.findFirst({
        where: { mercadoPagoId },
      });

      return donation;
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar por Mercado Pago ID:', error);
      throw error;
    }
  }

  async findBySubscriptionId(subscriptionId) {
    try {
      const prisma = this._getPrismaClient();
      const donation = await prisma.donation.findFirst({ where: { subscriptionId } });
      return donation;
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar por Subscription ID:', error);
      throw error;
    }
  }

  async existsBySubscriptionId(subscriptionId) {
    try {
      const prisma = this._getPrismaClient();
      const existing = await prisma.donation.findFirst({ where: { subscriptionId } });
      return !!existing;
    } catch (error) {
      console.error(
        '[PRISMA DONATION REPOSITORY] Erro ao verificar existência por Subscription ID:',
        error
      );
      throw error;
    }
  }

  async existsByMercadoPagoId(mercadoPagoId) {
    try {
      const prisma = this._getPrismaClient();
      const existing = await prisma.donation.findFirst({ where: { mercadoPagoId } });
      return !!existing;
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao verificar existência por MP ID:', error);
      throw error;
    }
  }

  async findPublicDonations(options = {}) {
    try {
      const { page = 1, limit = 20, status = 'approved' } = options;

      const skip = (page - 1) * limit;

      const where = {
        showInPublicList: true,
        paymentStatus: status,
      };

      const prisma = this._getPrismaClient();
      const [donations, total] = await Promise.all([
        prisma.donation.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            amount: true,
            donorName: true,
            message: true,
            isAnonymous: true,
            createdAt: true,
          },
        }),
        prisma.donation.count({ where }),
      ]);

      return {
        data: donations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar doações públicas:', error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      const prisma = this._getPrismaClient();
      const donation = await prisma.donation.update({
        where: { id },
        data: updateData,
      });

      return donation;
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao atualizar doação:', error);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;

      const skip = (page - 1) * limit;

      const prisma = this._getPrismaClient();
      const [donations, total] = await Promise.all([
        prisma.donation.findMany({
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.donation.count(),
      ]);

      return {
        data: donations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar todas as doações:', error);
      throw error;
    }
  }

  async count(filters = {}) {
    try {
      const where = {};

      if (filters.organizationId) {
        where.organizationId = filters.organizationId;
      }

      if (filters.status) {
        where.paymentStatus = filters.status;
      }

      const prisma = this._getPrismaClient();
      return await prisma.donation.count({ where });
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao contar doações:', error);
      throw error;
    }
  }

  async getStatistics(organizationId, dateRange = {}) {
    try {
      const where = {};
      if (organizationId) {
        where.organizationId = organizationId;
      }

      if (dateRange.startDate || dateRange.endDate) {
        where.createdAt = {};
        if (dateRange.startDate) {
          where.createdAt.gte = new Date(dateRange.startDate);
        }
        if (dateRange.endDate) {
          where.createdAt.lte = new Date(dateRange.endDate);
        }
      }

      const prisma = this._getPrismaClient();
      const [
        totalDonations,
        totalAmount,
        singleDonations,
        recurringDonations,
        approvedDonations,
        pendingDonations,
        anonymousDonations,
      ] = await Promise.all([
        prisma.donation.count({ where }),
        prisma.donation.aggregate({
          where: { ...where, paymentStatus: 'approved' },
          _sum: { amount: true },
          _avg: { amount: true },
        }),
        prisma.donation.count({ where: { ...where, type: 'single' } }),
        prisma.donation.count({ where: { ...where, type: 'recurring' } }),
        prisma.donation.count({ where: { ...where, paymentStatus: 'approved' } }),
        prisma.donation.count({ where: { ...where, paymentStatus: 'pending' } }),
        prisma.donation.count({ where: { ...where, isAnonymous: true } }),
      ]);

      return {
        totalDonations,
        totalAmount: totalAmount._sum.amount || 0,
        avgAmount: totalAmount._avg.amount || 0,
        singleDonations,
        recurringDonations,
        approvedDonations,
        pendingDonations,
        anonymousDonations,
        publicDonations: totalDonations - anonymousDonations,
      };
    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao obter estatísticas gerais:', error);
      throw error;
    }
  }
}

module.exports = PrismaDonationRepository;
