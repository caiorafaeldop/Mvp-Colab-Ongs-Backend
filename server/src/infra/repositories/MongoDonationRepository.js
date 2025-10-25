/**
 * REPOSITORY PATTERN - Implementação MongoDB para doações
 * Implementa persistência de doações usando MongoDB
 */

const mongoose = require('mongoose');

// Schema para doações
const DonationSchema = new mongoose.Schema(
  {
    organizationId: { type: String, required: true },
    organizationName: { type: String, required: true },
    donorEmail: { type: String, required: true },
    donorName: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['single', 'recurring'], required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    paymentId: { type: String },
    mercadoPagoId: { type: String, sparse: true },
    subscriptionId: { type: String },
    frequency: { type: String, enum: ['monthly', 'quarterly', 'yearly'] },
    message: { type: String },
    isAnonymous: { type: Boolean, default: false },
    metadata: { type: Object, default: {} },
  },
  {
    timestamps: true,
  }
);

const DonationModel = mongoose.model('Donation', DonationSchema);

class MongoDonationRepository {
  constructor() {
    console.log('[MONGO DONATION REPOSITORY] Inicializado');
  }

  async create(donationData) {
    try {
      const donation = await DonationModel.create(donationData);
      console.log('[MONGO DONATION REPOSITORY] Doação criada:', donation._id);
      return donation;
    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao criar doação:', error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      const donation = await DonationModel.findById(id);
      return donation;
    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar doação:', error.message);
      throw error;
    }
  }

  async findByOrganizationId(organizationId) {
    try {
      const donations = await DonationModel.find({ organizationId }).sort({ createdAt: -1 });
      return donations;
    } catch (error) {
      console.error(
        '[MONGO DONATION REPOSITORY] Erro ao buscar doações da organização:',
        error.message
      );
      throw error;
    }
  }

  async findByDonorEmail(donorEmail) {
    try {
      const donations = await DonationModel.find({ donorEmail }).sort({ createdAt: -1 });
      console.log(
        '[MONGO DONATION REPOSITORY] Encontradas',
        donations.length,
        'doações para',
        donorEmail
      );
      return donations;
    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar doações por email:', error.message);
      throw error;
    }
  }

  async updateStatus(id, status) {
    try {
      const donation = await DonationModel.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      );
      return donation;
    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao atualizar status:', error.message);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      const donation = await DonationModel.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
      console.log('[MONGO DONATION REPOSITORY] Doação atualizada:', id);
      return donation;
    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao atualizar doação:', error.message);
      throw error;
    }
  }

  async findAll() {
    try {
      const donations = await DonationModel.find().sort({ createdAt: -1 });
      return donations;
    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar todas as doações:', error.message);
      throw error;
    }
  }

  async findByMercadoPagoId(mercadoPagoId) {
    try {
      const donation = await DonationModel.findOne({ mercadoPagoId });
      return donation;
    } catch (error) {
      console.error('[MONGO DONATION REPOSITORY] Erro ao buscar doação por MP ID:', error.message);
      throw error;
    }
  }

  async existsByMercadoPagoId(mercadoPagoId) {
    try {
      const donation = await DonationModel.findOne({ mercadoPagoId });
      return !!donation;
    } catch (error) {
      console.error(
        '[MONGO DONATION REPOSITORY] Erro ao verificar existência por MP ID:',
        error.message
      );
      return false;
    }
  }

  async findBySubscriptionId(subscriptionId) {
    try {
      const donation = await DonationModel.findOne({ subscriptionId });
      return donation;
    } catch (error) {
      console.error(
        '[MONGO DONATION REPOSITORY] Erro ao buscar doação por subscription ID:',
        error.message
      );
      throw error;
    }
  }

  async existsBySubscriptionId(subscriptionId) {
    try {
      const donation = await DonationModel.findOne({ subscriptionId });
      return !!donation;
    } catch (error) {
      console.error(
        '[MONGO DONATION REPOSITORY] Erro ao verificar existência por subscription ID:',
        error.message
      );
      return false;
    }
  }
}

module.exports = MongoDonationRepository;
