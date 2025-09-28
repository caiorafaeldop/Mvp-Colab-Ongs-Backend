/**
 * REPOSITORY PATTERN - Implementação Prisma para doações
 * Usa o Prisma que já está configurado no projeto
 */

const IDonationRepository = require('../../domain/repositories/IDonationRepository');
const { PrismaClient } = require('@prisma/client');

class PrismaDonationRepository extends IDonationRepository {
  constructor() {
    super();
    this.prisma = new PrismaClient();
    console.log('[PRISMA DONATION REPOSITORY] Inicializado com sucesso');
  }

  async create(donationData) {
    try {
      const donation = await this.prisma.donation.create({
        data: {
          organizationId: donationData.organizationId,
          organizationName: donationData.organizationName || 'ONG',
          amount: donationData.amount,
          currency: donationData.currency || 'BRL',
          type: donationData.type || 'single',
          frequency: donationData.frequency,
          donorName: donationData.donorName,
          donorEmail: donationData.donorEmail,
          donorPhone: donationData.donorPhone,
          donorDocument: donationData.donorDocument,
          mercadoPagoId: donationData.mercadoPagoId,
          subscriptionId: donationData.subscriptionId,
          paymentStatus: donationData.paymentStatus || 'pending',
          paymentMethod: donationData.paymentMethod,
          metadata: donationData.metadata || {}
        }
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
      const donation = await this.prisma.donation.findUnique({
        where: { id }
      });
      
      return donation;

    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar doação por ID:', error);
      throw error;
    }
  }

  async findByMercadoPagoId(mercadoPagoId) {
    try {
      const donation = await this.prisma.donation.findFirst({
        where: { mercadoPagoId }
      });
      
      return donation;

    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar por Mercado Pago ID:', error);
      throw error;
    }
  }

  async findByOrganizationId(organizationId, filters = {}) {
    try {
      const where = { organizationId };
      
      if (filters.status) {
        where.paymentStatus = filters.status;
      }
      
      if (filters.type) {
        where.type = filters.type;
      }

      const donations = await this.prisma.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.skip || 0
      });

      return donations;

    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao buscar doações por organização:', error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      const donation = await this.prisma.donation.update({
        where: { id },
        data: updateData
      });

      return donation;

    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao atualizar doação:', error);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;

      const [donations, total] = await Promise.all([
        this.prisma.donation.findMany({
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        this.prisma.donation.count()
      ]);

      return {
        data: donations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
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

      return await this.prisma.donation.count({ where });

    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao contar doações:', error);
      throw error;
    }
  }

  async getStatistics(organizationId, dateRange = {}) {
    try {
      const where = { organizationId };
      
      if (dateRange.startDate || dateRange.endDate) {
        where.createdAt = {};
        if (dateRange.startDate) {
          where.createdAt.gte = new Date(dateRange.startDate);
        }
        if (dateRange.endDate) {
          where.createdAt.lte = new Date(dateRange.endDate);
        }
      }

      const [
        totalDonations,
        totalAmount,
        singleDonations,
        recurringDonations,
        approvedDonations
      ] = await Promise.all([
        this.prisma.donation.count({ where }),
        this.prisma.donation.aggregate({
          where,
          _sum: { amount: true },
          _avg: { amount: true }
        }),
        this.prisma.donation.count({ where: { ...where, type: 'single' } }),
        this.prisma.donation.count({ where: { ...where, type: 'recurring' } }),
        this.prisma.donation.count({ where: { ...where, paymentStatus: 'approved' } })
      ]);

      return {
        totalDonations,
        totalAmount: totalAmount._sum.amount || 0,
        avgAmount: totalAmount._avg.amount || 0,
        singleDonations,
        recurringDonations,
        approvedDonations,
        pendingDonations: totalDonations - approvedDonations
      };

    } catch (error) {
      console.error('[PRISMA DONATION REPOSITORY] Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

module.exports = PrismaDonationRepository;
