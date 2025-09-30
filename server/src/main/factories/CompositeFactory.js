/**
 * CompositeFactory - Factory para criar hierarquias de organizações
 */

const OrganizationLeaf = require('../../domain/composite/OrganizationLeaf');
const OrganizationComposite = require('../../domain/composite/OrganizationComposite');
const MongoOrganizationRepository = require('../../infra/repositories/MongoOrganizationRepository');
const { logger } = require('../../infra/logger');

class CompositeFactory {
  constructor(productRepository, donationRepository) {
    this.orgRepository = new MongoOrganizationRepository();
    this.productRepository = productRepository;
    this.donationRepository = donationRepository;
  }

  /**
   * Cria OrganizationComponent baseado no tipo
   * @param {Object} orgData - Dados da organização
   * @returns {OrganizationComponent}
   */
  createOrganization(orgData) {
    const type = orgData.type || 'independent';

    if (type === 'matrix' || type === 'branch') {
      logger.info(`[COMPOSITE FACTORY] Criando Composite: ${orgData.name}`);
      return new OrganizationComposite(
        orgData,
        this.productRepository,
        this.donationRepository
      );
    }

    logger.info(`[COMPOSITE FACTORY] Criando Leaf: ${orgData.name}`);
    return new OrganizationLeaf(
      orgData,
      this.productRepository,
      this.donationRepository
    );
  }

  /**
   * Constrói árvore de organizações do banco
   * @param {string} matrixId - ID da organização matriz
   * @returns {Promise<OrganizationComposite>}
   */
  async buildOrganizationTree(matrixId) {
    try {
      // Busca organização matriz
      const matrixData = await this.orgRepository.findById(matrixId);
      
      if (!matrixData) {
        throw new Error(`Organização matriz ${matrixId} não encontrada`);
      }

      const matrix = this.createOrganization(matrixData);

      // Busca filiais recursivamente
      await this._addChildren(matrix);

      logger.info(`[COMPOSITE FACTORY] Árvore construída: ${matrix.name}`);
      return matrix;

    } catch (error) {
      logger.error('[COMPOSITE FACTORY] Erro ao construir árvore:', error);
      throw error;
    }
  }

  /**
   * Adiciona filhas recursivamente
   * @private
   */
  async _addChildren(parent) {
    const children = await this.orgRepository.findByParentId(parent.id);

    for (const childData of children) {
      const child = this.createOrganization(childData);
      parent.add(child);

      // Se a filha também é composite, busca suas filhas
      if (child.isComposite()) {
        await this._addChildren(child);
      }
    }
  }

  /**
   * Retorna todas as organizações matrizes
   * @returns {Promise<Array<OrganizationComposite>>}
   */
  async getAllMatrixOrganizations() {
    try {
      const matrices = await this.orgRepository.findMatrixOrganizations();
      
      const trees = [];
      for (const matrixData of matrices) {
        const tree = await this.buildOrganizationTree(matrixData._id.toString());
        trees.push(tree);
      }

      return trees;

    } catch (error) {
      logger.error('[COMPOSITE FACTORY] Erro ao buscar matrizes:', error);
      throw error;
    }
  }
}

module.exports = CompositeFactory;
