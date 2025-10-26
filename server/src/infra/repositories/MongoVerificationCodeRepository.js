const VerificationCodeModel = require('../database/models/VerificationCodeModel');
const { logger } = require('../logger');

/**
 * Repositório MongoDB para gerenciar códigos de verificação
 */
class MongoVerificationCodeRepository {
  constructor() {
    // Usa Mongoose Model
  }

  /**
   * Criar um novo código de verificação
   */
  async create(data) {
    try {
      const verificationCode = await VerificationCodeModel.create({
        email: data.email,
        code: data.code,
        type: data.type,
        expiresAt: data.expiresAt,
        used: false,
        metadata: data.metadata || {},
      });

      logger.info('Código de verificação criado', {
        id: verificationCode._id.toString(),
        email: data.email,
        type: data.type,
      });

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
      const verificationCode = await VerificationCodeModel.findOne({
        email,
        code,
        type,
        used: false,
        expiresAt: {
          $gte: new Date(), // Código não expirado
        },
      }).sort({ createdAt: -1 });

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
      const result = await VerificationCodeModel.findByIdAndUpdate(
        id,
        { used: true },
        { new: true }
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
      const result = await VerificationCodeModel.updateMany(
        {
          email,
          type,
          used: false,
        },
        {
          used: true,
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

      const count = await VerificationCodeModel.countDocuments({
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
      const result = await VerificationCodeModel.deleteMany({
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
