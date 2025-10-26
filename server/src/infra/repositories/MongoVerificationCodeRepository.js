const { ObjectId } = require('mongodb');
const { logger } = require('../logger');

/**
 * Repositório MongoDB para gerenciar códigos de verificação
 */
class MongoVerificationCodeRepository {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('verificationCodes');
  }

  /**
   * Criar um novo código de verificação
   */
  async create(data) {
    try {
      const verificationCode = {
        email: data.email,
        code: data.code,
        type: data.type,
        expiresAt: data.expiresAt,
        used: false,
        metadata: data.metadata || {},
        createdAt: new Date(),
      };

      const result = await this.collection.insertOne(verificationCode);

      logger.info('Código de verificação criado', {
        id: result.insertedId.toString(),
        email: data.email,
        type: data.type,
      });

      return {
        id: result.insertedId.toString(),
        ...verificationCode,
      };
    } catch (error) {
      logger.error('Erro ao criar código de verificação', {
        error: error.message,
        email: data.email,
      });
      throw error;
    }
  }

  /**
   * Buscar código de verificação válido por email e tipo
   */
  async findValidCode(email, code, type) {
    try {
      const verificationCode = await this.collection.findOne({
        email,
        code,
        type,
        used: false,
        expiresAt: {
          $gte: new Date(), // Código não expirado
        },
      });

      if (!verificationCode) {
        return null;
      }

      return {
        id: verificationCode._id.toString(),
        email: verificationCode.email,
        code: verificationCode.code,
        type: verificationCode.type,
        expiresAt: verificationCode.expiresAt,
        used: verificationCode.used,
        metadata: verificationCode.metadata,
        createdAt: verificationCode.createdAt,
      };
    } catch (error) {
      logger.error('Erro ao buscar código de verificação', {
        error: error.message,
        email,
        type,
      });
      throw error;
    }
  }

  /**
   * Marcar código como usado
   */
  async markAsUsed(id) {
    try {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { used: true } }
      );

      logger.info('Código de verificação marcado como usado', { id });

      return result;
    } catch (error) {
      logger.error('Erro ao marcar código como usado', {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  /**
   * Invalidar todos os códigos anteriores de um email e tipo
   */
  async invalidatePreviousCodes(email, type) {
    try {
      const result = await this.collection.updateMany(
        {
          email,
          type,
          used: false,
        },
        {
          $set: { used: true },
        }
      );

      logger.info('Códigos anteriores invalidados', {
        email,
        type,
        count: result.modifiedCount,
      });

      return result;
    } catch (error) {
      logger.error('Erro ao invalidar códigos anteriores', {
        error: error.message,
        email,
        type,
      });
      throw error;
    }
  }

  /**
   * Contar tentativas recentes (para rate limiting)
   */
  async countRecentAttempts(email, type, minutesAgo) {
    try {
      const since = new Date(Date.now() - minutesAgo * 60 * 1000);

      const count = await this.collection.countDocuments({
        email,
        type,
        createdAt: {
          $gte: since,
        },
      });

      return count;
    } catch (error) {
      logger.error('Erro ao contar tentativas recentes', {
        error: error.message,
        email,
        type,
      });
      throw error;
    }
  }

  /**
   * Limpar códigos expirados (para manutenção)
   */
  async cleanExpiredCodes() {
    try {
      const result = await this.collection.deleteMany({
        expiresAt: {
          $lt: new Date(),
        },
      });

      logger.info('Códigos expirados removidos', { count: result.deletedCount });

      return result;
    } catch (error) {
      logger.error('Erro ao limpar códigos expirados', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = { MongoVerificationCodeRepository };
