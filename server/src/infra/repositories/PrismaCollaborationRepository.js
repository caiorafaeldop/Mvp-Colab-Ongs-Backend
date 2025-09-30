// Interface removida na limpeza
const Collaboration = require('../../domain/entities/Collaboration');
const PrismaService = require('../singletons/PrismaService');

/**
 * Implementação Prisma do Repository Pattern para Colaborações
 * Segue os princípios SOLID e Clean Architecture
 * Mantém compatibilidade com a interface existente
 */
class PrismaCollaborationRepository {
  constructor() {
    // super() removido na limpeza
    this.prismaService = PrismaService.getInstance();
  }

  /**
   * Obtém o cliente Prisma inicializado
   * @returns {PrismaClient} Cliente Prisma
   * @private
   */
  _getPrismaClient() {
    if (!this.prismaService.isReady()) {
      throw new Error('PrismaService não está inicializado. Chame initialize() primeiro.');
    }
    return this.prismaService.getClient();
  }

  /**
   * Converte dados do Prisma para entidade de domínio
   * @param {Object} collaborationData - Dados da colaboração do Prisma
   * @returns {Collaboration} Entidade de colaboração do domínio
   * @private
   */
  _mapToEntity(collaborationData) {
    return new Collaboration(
      collaborationData.id,
      collaborationData.requesterOrgId,
      collaborationData.requesterOrgName,
      collaborationData.targetOrgId,
      collaborationData.targetOrgName,
      collaborationData.title,
      collaborationData.description,
      collaborationData.status,
      collaborationData.createdAt,
      collaborationData.updatedAt
    );
  }

  /**
   * Converte entidade de domínio para dados do Prisma
   * @param {Collaboration} collaboration - Entidade de colaboração
   * @returns {Object} Dados para o Prisma
   * @private
   */
  _mapToPrismaData(collaboration) {
    const data = {
      requesterOrgId: collaboration.requesterOrgId,
      requesterOrgName: collaboration.requesterOrgName,
      targetOrgId: collaboration.targetOrgId,
      targetOrgName: collaboration.targetOrgName,
      title: collaboration.title,
      description: collaboration.description,
      status: collaboration.status || 'pending',
    };

    // Remove campos undefined
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });

    return data;
  }

  /**
   * Salva uma colaboração no banco de dados
   * @param {Collaboration} collaboration - Entidade de colaboração do domínio
   * @returns {Promise<Collaboration>} Colaboração salva como entidade de domínio
   */
  async save(collaboration) {
    try {
      console.log('[PRISMA COLLABORATION REPO] Salvando colaboração:', {
        title: collaboration.title,
        requesterOrgId: collaboration.requesterOrgId,
        targetOrgId: collaboration.targetOrgId,
      });

      const prisma = this._getPrismaClient();
      const collaborationData = this._mapToPrismaData(collaboration);

      const savedCollaboration = await prisma.collaboration.create({
        data: collaborationData,
      });

      console.log(
        '[PRISMA COLLABORATION REPO] Colaboração salva com sucesso:',
        savedCollaboration.id
      );
      return this._mapToEntity(savedCollaboration);
    } catch (error) {
      console.error('[PRISMA COLLABORATION REPO] Erro ao salvar colaboração:', error.message);
      throw new Error(`Error saving collaboration: ${error.message}`);
    }
  }

  /**
   * Busca colaboração por ID
   * @param {string} id - ID da colaboração
   * @returns {Promise<Collaboration|null>} Entidade de colaboração ou null
   */
  async findById(id) {
    try {
      console.log('[PRISMA COLLABORATION REPO] Buscando colaboração por ID:', id);

      const prisma = this._getPrismaClient();
      const collaboration = await prisma.collaboration.findUnique({
        where: { id },
      });

      console.log('[PRISMA COLLABORATION REPO] Colaboração encontrada:', !!collaboration);
      return collaboration ? this._mapToEntity(collaboration) : null;
    } catch (error) {
      console.error(
        '[PRISMA COLLABORATION REPO] Erro ao buscar colaboração por ID:',
        error.message
      );
      throw new Error(`Error finding collaboration by id: ${error.message}`);
    }
  }

  /**
   * Busca colaborações por ID da organização (como solicitante ou alvo)
   * @param {string} organizationId - ID da organização
   * @returns {Promise<Collaboration[]>} Lista de colaborações
   */
  async findByOrganizationId(organizationId) {
    try {
      console.log(
        '[PRISMA COLLABORATION REPO] Buscando colaborações por organização:',
        organizationId
      );

      const prisma = this._getPrismaClient();
      const collaborations = await prisma.collaboration.findMany({
        where: {
          OR: [{ requesterOrgId: organizationId }, { targetOrgId: organizationId }],
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(
        '[PRISMA COLLABORATION REPO] Colaborações encontradas por organização:',
        collaborations.length
      );
      return collaborations.map((collaboration) => this._mapToEntity(collaboration));
    } catch (error) {
      console.error(
        '[PRISMA COLLABORATION REPO] Erro ao buscar colaborações por organização:',
        error.message
      );
      throw new Error(`Error finding collaborations by organization: ${error.message}`);
    }
  }

  /**
   * Busca colaborações por status
   * @param {string} status - Status da colaboração (pending, accepted, rejected, completed)
   * @returns {Promise<Collaboration[]>} Lista de colaborações
   */
  async findByStatus(status) {
    try {
      console.log('[PRISMA COLLABORATION REPO] Buscando colaborações por status:', status);

      const prisma = this._getPrismaClient();
      const collaborations = await prisma.collaboration.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
      });

      console.log(
        '[PRISMA COLLABORATION REPO] Colaborações encontradas por status:',
        collaborations.length
      );
      return collaborations.map((collaboration) => this._mapToEntity(collaboration));
    } catch (error) {
      console.error(
        '[PRISMA COLLABORATION REPO] Erro ao buscar colaborações por status:',
        error.message
      );
      throw new Error(`Error finding collaborations by status: ${error.message}`);
    }
  }

  /**
   * Busca colaborações entre duas organizações específicas
   * @param {string} org1Id - ID da primeira organização
   * @param {string} org2Id - ID da segunda organização
   * @returns {Promise<Collaboration[]>} Lista de colaborações entre as organizações
   */
  async findBetweenOrganizations(org1Id, org2Id) {
    try {
      console.log('[PRISMA COLLABORATION REPO] Buscando colaborações entre organizações:', {
        org1Id,
        org2Id,
      });

      const prisma = this._getPrismaClient();
      const collaborations = await prisma.collaboration.findMany({
        where: {
          OR: [
            { requesterOrgId: org1Id, targetOrgId: org2Id },
            { requesterOrgId: org2Id, targetOrgId: org1Id },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(
        '[PRISMA COLLABORATION REPO] Colaborações encontradas entre organizações:',
        collaborations.length
      );
      return collaborations.map((collaboration) => this._mapToEntity(collaboration));
    } catch (error) {
      console.error(
        '[PRISMA COLLABORATION REPO] Erro ao buscar colaborações entre organizações:',
        error.message
      );
      throw new Error(`Error finding collaborations between organizations: ${error.message}`);
    }
  }

  /**
   * Atualiza uma colaboração
   * @param {string} id - ID da colaboração
   * @param {Object} collaborationData - Dados para atualização
   * @returns {Promise<Collaboration|null>} Colaboração atualizada ou null
   */
  async update(id, collaborationData) {
    try {
      console.log('[PRISMA COLLABORATION REPO] Atualizando colaboração:', id);

      const prisma = this._getPrismaClient();

      const updatedCollaboration = await prisma.collaboration.update({
        where: { id },
        data: {
          ...collaborationData,
          updatedAt: new Date(),
        },
      });

      console.log(
        '[PRISMA COLLABORATION REPO] Colaboração atualizada com sucesso:',
        updatedCollaboration.id
      );
      return this._mapToEntity(updatedCollaboration);
    } catch (error) {
      console.error('[PRISMA COLLABORATION REPO] Erro ao atualizar colaboração:', error.message);

      if (error.code === 'P2025') {
        console.log('[PRISMA COLLABORATION REPO] Colaboração não encontrada para atualização:', id);
        return null;
      }

      throw new Error(`Error updating collaboration: ${error.message}`);
    }
  }

  /**
   * Remove uma colaboração
   * @param {string} id - ID da colaboração
   * @returns {Promise<Collaboration|null>} Colaboração removida ou null
   */
  async delete(id) {
    try {
      console.log('[PRISMA COLLABORATION REPO] Removendo colaboração:', id);

      const prisma = this._getPrismaClient();
      const deletedCollaboration = await prisma.collaboration.delete({
        where: { id },
      });

      console.log(
        '[PRISMA COLLABORATION REPO] Colaboração removida com sucesso:',
        deletedCollaboration.id
      );
      return this._mapToEntity(deletedCollaboration);
    } catch (error) {
      console.error('[PRISMA COLLABORATION REPO] Erro ao remover colaboração:', error.message);

      if (error.code === 'P2025') {
        console.log('[PRISMA COLLABORATION REPO] Colaboração não encontrada para remoção:', id);
        return null;
      }

      throw new Error(`Error deleting collaboration: ${error.message}`);
    }
  }

  /**
   * Busca todas as colaborações
   * @returns {Promise<Collaboration[]>} Lista de todas as colaborações
   */
  async findAll() {
    try {
      console.log('[PRISMA COLLABORATION REPO] Buscando todas as colaborações');

      const prisma = this._getPrismaClient();
      const collaborations = await prisma.collaboration.findMany({
        orderBy: { createdAt: 'desc' },
      });

      console.log(
        '[PRISMA COLLABORATION REPO] Total de colaborações encontradas:',
        collaborations.length
      );
      return collaborations.map((collaboration) => this._mapToEntity(collaboration));
    } catch (error) {
      console.error(
        '[PRISMA COLLABORATION REPO] Erro ao buscar todas as colaborações:',
        error.message
      );
      throw new Error(`Error finding all collaborations: ${error.message}`);
    }
  }

  /**
   * Busca colaborações ativas (aceitas ou em andamento)
   * @returns {Promise<Collaboration[]>} Lista de colaborações ativas
   */
  async findActiveCollaborations() {
    try {
      console.log('[PRISMA COLLABORATION REPO] Buscando colaborações ativas');

      const prisma = this._getPrismaClient();
      const collaborations = await prisma.collaboration.findMany({
        where: {
          status: {
            in: ['accepted', 'completed'],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(
        '[PRISMA COLLABORATION REPO] Colaborações ativas encontradas:',
        collaborations.length
      );
      return collaborations.map((collaboration) => this._mapToEntity(collaboration));
    } catch (error) {
      console.error(
        '[PRISMA COLLABORATION REPO] Erro ao buscar colaborações ativas:',
        error.message
      );
      throw new Error(`Error finding active collaborations: ${error.message}`);
    }
  }

  /**
   * Busca colaborações pendentes para uma organização específica
   * @param {string} organizationId - ID da organização
   * @returns {Promise<Collaboration[]>} Lista de colaborações pendentes
   */
  async findPendingCollaborations(organizationId) {
    try {
      console.log(
        '[PRISMA COLLABORATION REPO] Buscando colaborações pendentes para organização:',
        organizationId
      );

      const prisma = this._getPrismaClient();
      const collaborations = await prisma.collaboration.findMany({
        where: {
          AND: [
            { status: 'pending' },
            {
              OR: [{ requesterOrgId: organizationId }, { targetOrgId: organizationId }],
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(
        '[PRISMA COLLABORATION REPO] Colaborações pendentes encontradas:',
        collaborations.length
      );
      return collaborations.map((collaboration) => this._mapToEntity(collaboration));
    } catch (error) {
      console.error(
        '[PRISMA COLLABORATION REPO] Erro ao buscar colaborações pendentes:',
        error.message
      );
      throw new Error(`Error finding pending collaborations: ${error.message}`);
    }
  }

  /**
   * Conta colaborações por status para uma organização
   * @param {string} organizationId - ID da organização
   * @param {string} status - Status da colaboração
   * @returns {Promise<number>} Número de colaborações
   */
  async countByStatusAndOrganization(organizationId, status) {
    try {
      console.log('[PRISMA COLLABORATION REPO] Contando colaborações por status e organização:', {
        organizationId,
        status,
      });

      const prisma = this._getPrismaClient();
      const count = await prisma.collaboration.count({
        where: {
          AND: [
            { status },
            {
              OR: [{ requesterOrgId: organizationId }, { targetOrgId: organizationId }],
            },
          ],
        },
      });

      console.log('[PRISMA COLLABORATION REPO] Total de colaborações encontradas:', count);
      return count;
    } catch (error) {
      console.error('[PRISMA COLLABORATION REPO] Erro ao contar colaborações:', error.message);
      throw new Error(`Error counting collaborations: ${error.message}`);
    }
  }
}

module.exports = PrismaCollaborationRepository;
