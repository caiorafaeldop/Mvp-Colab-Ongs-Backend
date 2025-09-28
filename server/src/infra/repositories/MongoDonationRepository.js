/**
 * REPOSITORY PATTERN - Implementação MongoDB para doações
 * Implementa persistência de doações usando MongoDB
 */

const IDonationRepository = require('../../domain/repositories/IDonationRepository');
const { ObjectId } = require('mongodb');

class MongoDonationRepository extends IDonationRepository {
  constructor(database) {
    super();
    
    // Verificar se database é válido
    if (!database || typeof database.collection !== 'function') {
      console.warn('[MONGO DONATION REPOSITORY] Database inválido, usando modo mock');
      this.mockMode = true;
      this.mockData = new Map();
    } else {
      this.db = database;
      this.collection = this.db.collection('donations');
      this.mockMode = false;
    }
    
    console.log('[MONGO DONATION REPOSITORY] Inicializado com sucesso', 
      this.mockMode ? '(modo mock)' : '(MongoDB)');
  }

  async create(donationData) {
    try {
      const donation = {
        ...donationData,
        _id: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.collection.insertOne(donation);
      
      console.log('[MONGO DONATION REPOSITORY] Doação criada:', result.insertedId);
      
      return {
        id: result.insertedId.toString(),
        ...donation
      };

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao criar doação:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const donation = await this.collection.findOne({ _id: new ObjectId(id) });
      
      if (donation) {
        return {
          id: donation._id.toString(),
          ...donation
        };
      }
      
      return null;

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar doação por ID:', error);
      throw error;
    }
  }

  async findByMercadoPagoId(mercadoPagoId) {
    try {
      const donation = await this.collection.findOne({ mercadoPagoId });
      
      if (donation) {
        return {
          id: donation._id.toString(),
          ...donation
        };
      }
      
      return null;

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar por Mercado Pago ID:', error);
      throw error;
    }
  }

  async findBySubscriptionId(subscriptionId) {
    try {
      const donation = await this.collection.findOne({ subscriptionId });
      
      if (donation) {
        return {
          id: donation._id.toString(),
          ...donation
        };
      }
      
      return null;

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar por Subscription ID:', error);
      throw error;
    }
  }

  async findByOrganizationId(organizationId, filters = {}) {
    try {
      const query = { organizationId };
      
      // Aplicar filtros
      if (filters.status) {
        query.paymentStatus = filters.status;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const donations = await this.collection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 100)
        .skip(filters.skip || 0)
        .toArray();

      return donations.map(donation => ({
        id: donation._id.toString(),
        ...donation
      }));

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar doações por organização:', error);
      throw error;
    }
  }

  async findByStatus(status) {
    try {
      const donations = await this.collection
        .find({ paymentStatus: status })
        .sort({ createdAt: -1 })
        .toArray();

      return donations.map(donation => ({
        id: donation._id.toString(),
        ...donation
      }));

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar doações por status:', error);
      throw error;
    }
  }

  async findByType(type) {
    try {
      const donations = await this.collection
        .find({ type })
        .sort({ createdAt: -1 })
        .toArray();

      return donations.map(donation => ({
        id: donation._id.toString(),
        ...donation
      }));

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar doações por tipo:', error);
      throw error;
    }
  }

  async findByDonorEmail(donorEmail) {
    try {
      const donations = await this.collection
        .find({ donorEmail })
        .sort({ createdAt: -1 })
        .toArray();

      return donations.map(donation => ({
        id: donation._id.toString(),
        ...donation
      }));

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar doações por email do doador:', error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Doação não encontrada');
      }

      return await this.findById(id);

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao atualizar doação:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
      
      return result.deletedCount > 0;

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao deletar doação:', error);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = -1,
        filters = {}
      } = options;

      const skip = (page - 1) * limit;
      const query = this.buildQuery(filters);

      const [donations, total] = await Promise.all([
        this.collection
          .find(query)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.collection.countDocuments(query)
      ]);

      return {
        data: donations.map(donation => ({
          id: donation._id.toString(),
          ...donation
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar todas as doações:', error);
      throw error;
    }
  }

  async count(filters = {}) {
    try {
      const query = this.buildQuery(filters);
      return await this.collection.countDocuments(query);

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao contar doações:', error);
      throw error;
    }
  }

  async getStatistics(organizationId, dateRange = {}) {
    try {
      const matchStage = { organizationId };
      
      if (dateRange.startDate || dateRange.endDate) {
        matchStage.createdAt = {};
        if (dateRange.startDate) {
          matchStage.createdAt.$gte = new Date(dateRange.startDate);
        }
        if (dateRange.endDate) {
          matchStage.createdAt.$lte = new Date(dateRange.endDate);
        }
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            singleDonations: {
              $sum: { $cond: [{ $eq: ['$type', 'single'] }, 1, 0] }
            },
            recurringDonations: {
              $sum: { $cond: [{ $eq: ['$type', 'recurring'] }, 1, 0] }
            },
            approvedDonations: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'approved'] }, 1, 0] }
            },
            pendingDonations: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
            }
          }
        }
      ];

      const result = await this.collection.aggregate(pipeline).toArray();
      
      if (result.length === 0) {
        return {
          totalDonations: 0,
          totalAmount: 0,
          avgAmount: 0,
          singleDonations: 0,
          recurringDonations: 0,
          approvedDonations: 0,
          pendingDonations: 0
        };
      }

      return result[0];

    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Constrói query MongoDB baseada em filtros
   */
  buildQuery(filters) {
    const query = {};

    if (filters.organizationId) {
      query.organizationId = filters.organizationId;
    }

    if (filters.status) {
      query.paymentStatus = filters.status;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.donorEmail) {
      query.donorEmail = filters.donorEmail;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    return query;
  }
}

module.exports = MongoDonationRepository;
