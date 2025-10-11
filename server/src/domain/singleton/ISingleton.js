/**
 * Interface base para implementação do padrão Singleton
 * Define o contrato que todos os singletons devem seguir
 */
class ISingleton {
  constructor() {
    if (this.constructor === ISingleton) {
      throw new Error('ISingleton é uma interface abstrata e não pode ser instanciada diretamente');
    }
  }

  /**
   * Método estático que deve ser implementado por todas as classes filhas
   * @returns {ISingleton} Instância única da classe
   */
  static getInstance() {
    throw new Error('Método getInstance() deve ser implementado pela classe filha');
  }

  /**
   * Método para destruir a instância (útil para testes)
   */
  static destroyInstance() {
    throw new Error('Método destroyInstance() deve ser implementado pela classe filha');
  }

  /**
   * Verifica se uma instância já existe
   * @returns {boolean} True se instância existe
   */
  static hasInstance() {
    throw new Error('Método hasInstance() deve ser implementado pela classe filha');
  }
}

module.exports = ISingleton;
