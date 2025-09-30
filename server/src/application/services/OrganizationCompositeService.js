/**
 * OrganizationCompositeService - Lógica de negócio para hierarquias de organizações
 * 
 * Implementa o padrão Composite para gerenciar organizações com filiais.
 * Fornece operações de alto nível para criar, gerenciar e consultar
 * estruturas hierárquicas de organizações.
 */

const CompositeFactory = require('../../main/factories/CompositeFactory');
const { logger } = require('../../infra/logger');

class OrganizationCompositeService {
  constructor(organizationRepository, productRepository, donationRepository) {
    this.organizationRepository = organizationRepository;
    this.productRepository = productRepository;
    this.donationRepository = donationRepository;
    this.compositeFactory = new CompositeFactory(productRepository, donationRepository);
  }

  /**
   * Cria uma nova organização (Leaf ou Composite baseado no tipo)
   * @param {Object} orgData - Dados da organização
   * @returns {Promise<Object>}
   */
  async createOrganization(orgData) {
    try {
      // Validações básicas
      this._validateOrganizationData(orgData);

      // Se tem parentId, validar se o pai existe
      if (orgData.parentId) {
        const parent = await this.organizationRepository.findById(orgData.parentId);
        if (!parent) {
          throw new Error(`Organização pai ${orgData.parentId} não encontrada`);
        }
      }

      // Salvar no banco
      const savedOrg = await this.organizationRepository.create(orgData);
      
      // Criar componente usando factory
      const orgComponent = this.compositeFactory.createOrganization(savedOrg);

      logger.info(`[COMPOSITE SERVICE] Organização criada: ${orgComponent.name} (${orgComponent.isComposite() ? 'COMPOSITE' : 'LEAF'})`);

      return {
        success: true,
        data: orgComponent.getInfo(),
        type: orgComponent.isComposite() ? 'composite' : 'leaf'
      };

    } catch (error) {
      logger.error('[COMPOSITE SERVICE] Erro ao criar organização:', error);
      throw error;
    }
  }

  /**
   * Busca árvore completa de uma organização
   * @param {string} organizationId - ID da organização raiz
   * @returns {Promise<Object>}
   */
  async getOrganizationTree(organizationId) {
    try {
      const tree = await this.compositeFactory.buildOrganizationTree(organizationId);
      
      return {
        success: true,
        data: {
          tree: tree.getOrganizationTree(),
          display: tree.display(),
          totalOrganizations: tree.countOrganizations(),
          isComposite: tree.isComposite()
        }
      };

    } catch (error) {
      logger.error('[COMPOSITE SERVICE] Erro ao buscar árvore:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas agregadas de uma organização e suas filiais
   * @param {string} organizationId - ID da organização
   * @returns {Promise<Object>}
   */
  async getOrganizationMetrics(organizationId) {
    try {
      const orgComponent = await this.compositeFactory.buildOrganizationTree(organizationId);
      
      const [totalProducts, totalDonations] = await Promise.all([
        orgComponent.getTotalProducts(),
        orgComponent.getTotalDonations()
      ]);

      return {
        success: true,
        data: {
          organizationId: orgComponent.id,
          organizationName: orgComponent.name,
          isComposite: orgComponent.isComposite(),
          totalOrganizations: orgComponent.countOrganizations(),
          totalProducts,
          totalDonations,
          metrics: {
            averageProductsPerOrg: Math.round(totalProducts / orgComponent.countOrganizations()),
            averageDonationsPerOrg: Math.round(totalDonations / orgComponent.countOrganizations())
          }
        }
      };

    } catch (error) {
      logger.error('[COMPOSITE SERVICE] Erro ao calcular métricas:', error);
      throw error;
    }
  }

  /**
   * Adiciona uma organização como filial de outra
   * @param {string} parentId - ID da organização pai
   * @param {string} childId - ID da organização filha
   * @returns {Promise<Object>}
   */
  async addChildOrganization(parentId, childId) {
    try {
      // Validar se ambas existem
      const [parent, child] = await Promise.all([
        this.organizationRepository.findById(parentId),
        this.organizationRepository.findById(childId)
      ]);

      if (!parent) throw new Error(`Organização pai ${parentId} não encontrada`);
      if (!child) throw new Error(`Organização filha ${childId} não encontrada`);

      // Validar se não vai criar ciclo
      await this._validateNoCycle(parentId, childId);

      // Atualizar parentId da filha
      await this.organizationRepository.update(childId, { parentId });

      // Reconstruir árvore para verificar
      const tree = await this.compositeFactory.buildOrganizationTree(parentId);

      logger.info(`[COMPOSITE SERVICE] ${child.name} adicionada como filial de ${parent.name}`);

      return {
        success: true,
        message: `${child.name} adicionada como filial de ${parent.name}`,
        data: tree.getOrganizationTree()
      };

    } catch (error) {
      logger.error('[COMPOSITE SERVICE] Erro ao adicionar filial:', error);
      throw error;
    }
  }

  /**
   * Remove uma organização filial
   * @param {string} parentId - ID da organização pai
   * @param {string} childId - ID da organização filha
   * @returns {Promise<Object>}
   */
  async removeChildOrganization(parentId, childId) {
    try {
      const child = await this.organizationRepository.findById(childId);
      if (!child) throw new Error(`Organização filha ${childId} não encontrada`);

      if (child.parentId !== parentId) {
        throw new Error(`${childId} não é filial de ${parentId}`);
      }

      // Remover parentId (tornar independente)
      await this.organizationRepository.update(childId, { parentId: null });

      logger.info(`[COMPOSITE SERVICE] ${child.name} removida como filial de ${parentId}`);

      return {
        success: true,
        message: `${child.name} removida como filial e tornou-se independente`,
        data: { childId, parentId: null }
      };

    } catch (error) {
      logger.error('[COMPOSITE SERVICE] Erro ao remover filial:', error);
      throw error;
    }
  }

  /**
   * Lista todas as organizações matrizes (sem pai)
   * @returns {Promise<Object>}
   */
  async getAllMatrixOrganizations() {
    try {
      const matrices = await this.compositeFactory.getAllMatrixOrganizations();
      
      const result = await Promise.all(
        matrices.map(async (matrix) => ({
          ...matrix.getOrganizationTree(),
          totalOrganizations: matrix.countOrganizations(),
          totalProducts: await matrix.getTotalProducts(),
          totalDonations: await matrix.getTotalDonations()
        }))
      );

      return {
        success: true,
        data: result,
        total: result.length
      };

    } catch (error) {
      logger.error('[COMPOSITE SERVICE] Erro ao buscar matrizes:', error);
      throw error;
    }
  }

  /**
   * Busca organização específica em uma árvore
   * @param {string} treeRootId - ID da raiz da árvore
   * @param {string} targetId - ID da organização procurada
   * @returns {Promise<Object>}
   */
  async findOrganizationInTree(treeRootId, targetId) {
    try {
      const tree = await this.compositeFactory.buildOrganizationTree(treeRootId);
      const found = tree.findById(targetId);

      if (!found) {
        return {
          success: false,
          message: `Organização ${targetId} não encontrada na árvore de ${treeRootId}`
        };
      }

      return {
        success: true,
        data: {
          ...found.getInfo(),
          isComposite: found.isComposite(),
          path: this._getOrganizationPath(tree, targetId)
        }
      };

    } catch (error) {
      logger.error('[COMPOSITE SERVICE] Erro ao buscar na árvore:', error);
      throw error;
    }
  }

  /**
   * Valida dados da organização
   * @private
   */
  _validateOrganizationData(orgData) {
    if (!orgData.name || orgData.name.trim().length === 0) {
      throw new Error('Nome da organização é obrigatório');
    }

    if (!orgData.email || !this._isValidEmail(orgData.email)) {
      throw new Error('Email válido é obrigatório');
    }

    const validTypes = ['independent', 'matrix', 'branch'];
    if (orgData.type && !validTypes.includes(orgData.type)) {
      throw new Error(`Tipo deve ser um de: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Valida email
   * @private
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida se não vai criar ciclo na hierarquia
   * @private
   */
  async _validateNoCycle(parentId, childId) {
    // Se child já é pai de parent (direta ou indiretamente), seria um ciclo
    try {
      const childTree = await this.compositeFactory.buildOrganizationTree(childId);
      const foundParent = childTree.findById(parentId);
      
      if (foundParent) {
        throw new Error('Operação criaria um ciclo na hierarquia');
      }
    } catch (error) {
      if (error.message.includes('não encontrada')) {
        // Child não tem árvore própria, ok para adicionar
        return;
      }
      throw error;
    }
  }

  /**
   * Retorna caminho da organização na árvore
   * @private
   */
  _getOrganizationPath(tree, targetId) {
    const path = [];
    
    const findPath = (node, target, currentPath) => {
      currentPath.push({ id: node.id, name: node.name });
      
      if (node.id === target) {
        path.push(...currentPath);
        return true;
      }
      
      if (node.isComposite()) {
        for (const child of node.getChildren()) {
          if (findPath(child, target, [...currentPath])) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    findPath(tree, targetId, []);
    return path;
  }
}

module.exports = OrganizationCompositeService;
