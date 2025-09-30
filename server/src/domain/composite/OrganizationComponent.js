/**
 * COMPOSITE PATTERN (Estrutural)
 *
 * OrganizationComponent - Interface base para organizações
 *
 * Define interface comum para:
 * - OrganizationLeaf (organizações simples sem filiais)
 * - OrganizationComposite (organizações com filiais)
 *
 * Permite tratar objetos individuais e composições uniformemente.
 */

class OrganizationComponent {
  constructor(data) {
    this.id = data.id || data._id;
    this.name = data.name;
    this.email = data.email;
    this.type = data.type || 'independent';
    this.parentId = data.parentId || null;
    this.metadata = data.metadata || {};
  }

  /**
   * Adiciona organização filha (sobreescrito em Composite)
   * @param {OrganizationComponent} child
   */
  add(child) {
    throw new Error('OrganizationComponent.add() deve ser implementado');
  }

  /**
   * Remove organização filha (sobreescrito em Composite)
   * @param {string} childId
   */
  remove(childId) {
    throw new Error('OrganizationComponent.remove() deve ser implementado');
  }

  /**
   * Retorna filha específica (sobreescrito em Composite)
   * @param {string} childId
   */
  getChild(childId) {
    throw new Error('OrganizationComponent.getChild() deve ser implementado');
  }

  /**
   * Verifica se é composite (tem filhas)
   * @returns {boolean}
   */
  isComposite() {
    return false;
  }

  /**
   * Retorna total de produtos (a ser implementado)
   * @returns {Promise<number>}
   */
  async getTotalProducts() {
    throw new Error('getTotalProducts() deve ser implementado');
  }

  /**
   * Retorna total de doações (a ser implementado)
   * @returns {Promise<number>}
   */
  async getTotalDonations() {
    throw new Error('getTotalDonations() deve ser implementado');
  }

  /**
   * Retorna informações da organização
   * @returns {Object}
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      type: this.type,
      parentId: this.parentId,
    };
  }

  /**
   * Exibe estrutura em árvore (a ser implementado)
   * @param {number} depth
   * @returns {string}
   */
  display(depth = 0) {
    throw new Error('display() deve ser implementado');
  }
}

module.exports = OrganizationComponent;
