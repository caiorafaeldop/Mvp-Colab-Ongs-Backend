/**
 * COMPOSITE (Composite Pattern)
 *
 * OrganizationComposite - Organização matriz (com filiais)
 *
 * Pode conter outras organizações (Composite ou Leaf).
 * Operações são executadas recursivamente em toda a árvore.
 */

const OrganizationComponent = require('./OrganizationComponent');

// Fallback logger
let logger;
try {
  logger = require('../../infra/logger').logger || console;
} catch {
  logger = console;
}

class OrganizationComposite extends OrganizationComponent {
  constructor(data, productRepository = null, donationRepository = null) {
    super(data);
    this.children = [];
    this.productRepository = productRepository;
    this.donationRepository = donationRepository;
  }

  /**
   * Adiciona organização filha
   * @param {OrganizationComponent} child - Leaf ou Composite
   */
  add(child) {
    if (!(child instanceof OrganizationComponent)) {
      throw new Error('Child deve ser uma instância de OrganizationComponent');
    }

    this.children.push(child);
    logger.info(`[COMPOSITE] ${child.name} adicionada como filial de ${this.name}`);
  }

  /**
   * Remove organização filha por ID
   * @param {string} childId
   */
  remove(childId) {
    const index = this.children.findIndex((c) => c.id === childId);

    if (index === -1) {
      logger.warn(`[COMPOSITE] Filial ${childId} não encontrada em ${this.name}`);
      return false;
    }

    const removed = this.children.splice(index, 1)[0];
    logger.info(`[COMPOSITE] ${removed.name} removida de ${this.name}`);
    return true;
  }

  /**
   * Retorna filha específica por ID
   * @param {string} childId
   * @returns {OrganizationComponent|null}
   */
  getChild(childId) {
    return this.children.find((c) => c.id === childId) || null;
  }

  /**
   * Retorna todas as filhas
   * @returns {Array<OrganizationComponent>}
   */
  getChildren() {
    return [...this.children];
  }

  /**
   * É composite
   */
  isComposite() {
    return true;
  }

  /**
   * Retorna total de produtos RECURSIVO (desta org + todas as filiais)
   * @returns {Promise<number>}
   */
  async getTotalProducts() {
    let total = 0;

    // Produtos desta organização
    if (this.productRepository) {
      try {
        const products = await this.productRepository.findByOrganizationId(this.id);
        total += products ? products.length : 0;
      } catch (error) {
        logger.error(`[COMPOSITE] Erro ao buscar produtos de ${this.name}:`, error);
      }
    }

    // Produtos das filiais (RECURSIVO)
    for (const child of this.children) {
      total += await child.getTotalProducts();
    }

    logger.info(`[COMPOSITE] ${this.name} - Total de produtos (recursivo): ${total}`);
    return total;
  }

  /**
   * Retorna total de doações RECURSIVO (desta org + todas as filiais)
   * @returns {Promise<number>}
   */
  async getTotalDonations() {
    let total = 0;

    // Doações desta organização
    if (this.donationRepository) {
      try {
        const donations = await this.donationRepository.findByOrganizationId(this.id);
        total += donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      } catch (error) {
        logger.error(`[COMPOSITE] Erro ao buscar doações de ${this.name}:`, error);
      }
    }

    // Doações das filiais (RECURSIVO)
    for (const child of this.children) {
      total += await child.getTotalDonations();
    }

    logger.info(`[COMPOSITE] ${this.name} - Total de doações (recursivo): R$ ${total.toFixed(2)}`);
    return total;
  }

  /**
   * Retorna todos os produtos RECURSIVAMENTE
   * @returns {Promise<Array>}
   */
  async getAllProducts() {
    let allProducts = [];

    // Produtos desta organização
    if (this.productRepository) {
      try {
        const products = await this.productRepository.findByOrganizationId(this.id);
        allProducts = allProducts.concat(products || []);
      } catch (error) {
        logger.error(`[COMPOSITE] Erro ao buscar produtos de ${this.name}:`, error);
      }
    }

    // Produtos das filiais (RECURSIVO)
    for (const child of this.children) {
      if (child.isComposite()) {
        allProducts = allProducts.concat(await child.getAllProducts());
      } else {
        // Leaf - buscar diretamente
        if (child.productRepository) {
          try {
            const products = await child.productRepository.findByOrganizationId(child.id);
            allProducts = allProducts.concat(products || []);
          } catch (error) {
            logger.error(`[COMPOSITE] Erro ao buscar produtos de ${child.name}:`, error);
          }
        }
      }
    }

    return allProducts;
  }

  /**
   * Exibe estrutura em árvore RECURSIVAMENTE
   * @param {number} depth - Profundidade atual
   * @returns {string}
   */
  display(depth = 0) {
    const indent = '  '.repeat(depth);
    let tree = `${indent}${depth === 0 ? '📁' : '├─'} ${this.name} [COMPOSITE] (${this.children.length} filiais)\n`;

    // Exibe filhas recursivamente
    this.children.forEach((child, index) => {
      tree += child.display(depth + 1);
      if (index < this.children.length - 1) {
        tree += '\n';
      }
    });

    return tree;
  }

  /**
   * Retorna árvore de organizações como JSON
   * @returns {Object}
   */
  getOrganizationTree() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      isComposite: true,
      children: this.children.map((child) => {
        if (child.isComposite()) {
          return child.getOrganizationTree();
        }
        return {
          id: child.id,
          name: child.name,
          type: child.type,
          isComposite: false,
          children: [],
        };
      }),
    };
  }

  /**
   * Busca organização na árvore por ID (RECURSIVO)
   * @param {string} orgId
   * @returns {OrganizationComponent|null}
   */
  findById(orgId) {
    if (this.id === orgId) {
      return this;
    }

    for (const child of this.children) {
      if (child.id === orgId) {
        return child;
      }

      if (child.isComposite()) {
        const found = child.findById(orgId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Conta total de organizações na árvore (RECURSIVO)
   * @returns {number}
   */
  countOrganizations() {
    let count = 1; // Esta organização

    for (const child of this.children) {
      if (child.isComposite()) {
        count += child.countOrganizations();
      } else {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Retorna representação em string
   */
  toString() {
    return `OrganizationComposite[${this.name}] with ${this.children.length} children`;
  }
}

module.exports = OrganizationComposite;
