/**
 * Interface base para padrão Decorator
 * Define estrutura comum para decorators do sistema
 */
class IDecorator {
  constructor(component) {
    this.component = component;
  }

  /**
   * Executa operação decorada
   * @param {...any} args - Argumentos da operação
   * @returns {Promise<any>} Resultado da operação
   */
  async execute(...args) {
    throw new Error('Method execute must be implemented');
  }

  /**
   * Obtém componente decorado
   * @returns {Object} Componente
   */
  getComponent() {
    return this.component;
  }

  /**
   * Obtém nome do decorator
   * @returns {string} Nome do decorator
   */
  getName() {
    return this.constructor.name;
  }
}

module.exports = IDecorator;
