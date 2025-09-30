/**
 * LEAF (Composite Pattern)
 *
 * OrganizationLeaf - Organização folha (sem filiais)
 *
 * Representa organizações independentes ou filiais finais que não têm sub-organizações.
 */

const OrganizationComponent = require('./OrganizationComponent');

// Fallback logger se não existir
let logger;
try {
  logger = require('../../infra/logger').logger || console;
} catch {
  logger = console;
}

class OrganizationLeaf extends OrganizationComponent {
  constructor(data, productRepository = null, donationRepository = null) {
    super(data);
    this.productRepository = productRepository;
    this.donationRepository = donationRepository;
  }

  /**
   * Leaf não pode adicionar filhas
   */
  add(child) {
    logger.warn(`[LEAF] ${this.name} é uma organização folha, não pode ter filiais`);
    throw new Error(`${this.name} é uma organização folha (leaf), não pode adicionar filiais`);
  }

  /**
   * Leaf não pode remover filhas
   */
  remove(childId) {
    logger.warn(`[LEAF] ${this.name} é uma organização folha, não tem filiais`);
    throw new Error(`${this.name} é uma organização folha (leaf), não tem filiais para remover`);
  }

  /**
   * Leaf não tem filhas
   */
  getChild(childId) {
    return null;
  }

  /**
   * Leaf não é composite
   */
  isComposite() {
    return false;
  }

  /**
   * Retorna total de produtos APENAS desta organização
   * @returns {Promise<number>}
   */
  async getTotalProducts() {
    if (!this.productRepository) {
      logger.warn(`[LEAF] ${this.name} sem productRepository, retornando 0`);
      return 0;
    }

    try {
      const products = await this.productRepository.findByOrganizationId(this.id);
      return products ? products.length : 0;
    } catch (error) {
      logger.error(`[LEAF] Erro ao buscar produtos de ${this.name}:`, error);
      return 0;
    }
  }

  /**
   * Retorna total de doações APENAS desta organização
   * @returns {Promise<number>}
   */
  async getTotalDonations() {
    if (!this.donationRepository) {
      logger.warn(`[LEAF] ${this.name} sem donationRepository, retornando 0`);
      return 0;
    }

    try {
      const donations = await this.donationRepository.findByOrganizationId(this.id);
      const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      return total;
    } catch (error) {
      logger.error(`[LEAF] Erro ao buscar doações de ${this.name}:`, error);
      return 0;
    }
  }

  /**
   * Exibe informações da organização leaf
   * @param {number} depth - Profundidade na árvore
   * @returns {string}
   */
  display(depth = 0) {
    const indent = '  '.repeat(depth);
    return `${indent}└─ ${this.name} [LEAF] (${this.type})`;
  }

  /**
   * Retorna representação em string
   */
  toString() {
    return `OrganizationLeaf[${this.name}]`;
  }
}

module.exports = OrganizationLeaf;
