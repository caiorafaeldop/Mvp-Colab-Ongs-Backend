const { PrismaClient } = require('@prisma/client');
const { logger } = require('../logger');

/**
 * Repositório para gerenciar códigos de verificação
 */
class VerificationCodeRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Criar um novo código de verificação
   */
  async create(data) {
    try {
      const verificationCode = await this.prisma.verificationCode.create({
        data: {
          email: data.email,
          code: data.code,
          type: data.type,
          expiresAt: data.expiresAt,
          used: false,
        },
      });

      logger.info('Código de verificação criado', {
        id: verificationCode.id,
        email: data.email,
        type: data.type,
      });

      return verificationCode;
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
      const verificationCode = await this.prisma.verificationCode.findFirst({
        where: {
          email,
          code,
          type,
          used: false,
          expiresAt: {
            gte: new Date(), // Código não expirado
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return verificationCode;
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
      const verificationCode = await this.prisma.verificationCode.update({
        where: { id },
        data: { used: true },
      });

      logger.info('Código de verificação marcado como usado', { id });

      return verificationCode;
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
      const result = await this.prisma.verificationCode.updateMany({
        where: {
          email,
          type,
          used: false,
        },
        data: {
          used: true,
        },
      });

      logger.info('Códigos anteriores invalidados', {
        email,
        type,
        count: result.count,
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
   * Limpar códigos expirados (para manutenção)
   */
  async cleanExpiredCodes() {
    try {
      const result = await this.prisma.verificationCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Códigos expirados removidos', { count: result.count });

      return result;
    } catch (error) {
      logger.error('Erro ao limpar códigos expirados', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Contar tentativas recentes de um email
   */
  async countRecentAttempts(email, type, minutesAgo = 5) {
    try {
      const since = new Date(Date.now() - minutesAgo * 60 * 1000);

      const count = await this.prisma.verificationCode.count({
        where: {
          email,
          type,
          createdAt: {
            gte: since,
          },
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
}

// Singleton instance
let instance = null;

/**
 * Obter instância singleton do VerificationCodeRepository
 */
function getVerificationCodeRepository() {
  if (!instance) {
    instance = new VerificationCodeRepository();
  }
  return instance;
}

module.exports = { VerificationCodeRepository, getVerificationCodeRepository };
