/**
 * MongoOrganizationRepository - Repository para Organization (Composite Pattern)
 */

const OrganizationModel = require('../database/models/OrganizationModel');
const { logger } = require('../logger');

class MongoOrganizationRepository {
  async findById(id) {
    try {
      return await OrganizationModel.findById(id);
    } catch (error) {
      logger.error('[MongoOrganizationRepository] Erro em findById:', error);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await OrganizationModel.findOne({ email });
    } catch (error) {
      logger.error('[MongoOrganizationRepository] Erro em findByEmail:', error);
      throw error;
    }
  }

  async findByParentId(parentId) {
    try {
      return await OrganizationModel.find({ parentId });
    } catch (error) {
      logger.error('[MongoOrganizationRepository] Erro em findByParentId:', error);
      throw error;
    }
  }

  async findMatrixOrganizations() {
    try {
      return await OrganizationModel.find({ type: 'matrix' });
    } catch (error) {
      logger.error('[MongoOrganizationRepository] Erro em findMatrixOrganizations:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      return await OrganizationModel.find();
    } catch (error) {
      logger.error('[MongoOrganizationRepository] Erro em findAll:', error);
      throw error;
    }
  }

  async save(data) {
    try {
      const org = new OrganizationModel(data);
      return await org.save();
    } catch (error) {
      logger.error('[MongoOrganizationRepository] Erro em save:', error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      return await OrganizationModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );
    } catch (error) {
      logger.error('[MongoOrganizationRepository] Erro em update:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      return await OrganizationModel.findByIdAndDelete(id);
    } catch (error) {
      logger.error('[MongoOrganizationRepository] Erro em delete:', error);
      throw error;
    }
  }
}

module.exports = MongoOrganizationRepository;
