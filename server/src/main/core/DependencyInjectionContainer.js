/**
 * DEPENDENCY INJECTION PATTERN (Criacional)
 * 
 * Container centralizado para gerenciar todas as dependências da aplicação.
 * Facilita testes, desacoplamento e manutenção.
 * 
 * Implementa:
 * - Constructor Injection
 * - Setter Injection
 * - Interface Injection
 * - Singleton Management
 */

class DependencyInjectionContainer {
  constructor() {
    this.dependencies = new Map();
    this.singletons = new Map();
    this.factories = new Map();
    
    console.log('[DI CONTAINER] Dependency Injection Container inicializado');
  }

  /**
   * Registra uma dependência como singleton
   * @param {string} name - Nome da dependência
   * @param {any} instance - Instância singleton
   */
  registerSingleton(name, instance) {
    this.singletons.set(name, instance);
    console.log(`[DI CONTAINER] Singleton registrado: ${name}`);
  }

  /**
   * Registra uma factory para criação de dependências
   * @param {string} name - Nome da dependência
   * @param {Function} factory - Factory function
   */
  registerFactory(name, factory) {
    this.factories.set(name, factory);
    console.log(`[DI CONTAINER] Factory registrada: ${name}`);
  }

  /**
   * Registra uma dependência simples
   * @param {string} name - Nome da dependência
   * @param {any} value - Valor da dependência
   */
  register(name, value) {
    this.dependencies.set(name, value);
    console.log(`[DI CONTAINER] Dependência registrada: ${name}`);
  }

  /**
   * Resolve uma dependência pelo nome
   * @param {string} name - Nome da dependência
   * @returns {any} Instância da dependência
   */
  resolve(name) {
    // Verifica singleton
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Verifica factory
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      return factory(this);
    }

    // Verifica dependência simples
    if (this.dependencies.has(name)) {
      return this.dependencies.get(name);
    }

    throw new Error(`[DI CONTAINER] Dependência não encontrada: ${name}`);
  }

  /**
   * Verifica se uma dependência está registrada
   * @param {string} name - Nome da dependência
   * @returns {boolean}
   */
  has(name) {
    return this.singletons.has(name) || 
           this.factories.has(name) || 
           this.dependencies.has(name);
  }

  /**
   * Injeta dependências em um objeto via constructor
   * @param {Class} Class - Classe a ser instanciada
   * @param {Array<string>} dependencyNames - Nomes das dependências
   * @returns {Object} Instância com dependências injetadas
   */
  createWithDependencies(Class, dependencyNames = []) {
    const dependencies = dependencyNames.map(name => this.resolve(name));
    return new Class(...dependencies);
  }

  /**
   * Injeta dependências via setter
   * @param {Object} instance - Instância do objeto
   * @param {Object} dependencyMap - Mapa de setters e dependências
   */
  injectViaSetter(instance, dependencyMap) {
    Object.entries(dependencyMap).forEach(([setter, dependencyName]) => {
      const dependency = this.resolve(dependencyName);
      instance[setter](dependency);
    });
  }

  /**
   * Retorna todas as dependências registradas
   * @returns {Object} Estatísticas do container
   */
  getStats() {
    return {
      totalDependencies: this.dependencies.size + this.singletons.size + this.factories.size,
      singletons: Array.from(this.singletons.keys()),
      factories: Array.from(this.factories.keys()),
      dependencies: Array.from(this.dependencies.keys())
    };
  }

  /**
   * Limpa todas as dependências (útil para testes)
   */
  clear() {
    this.dependencies.clear();
    this.singletons.clear();
    this.factories.clear();
    console.log('[DI CONTAINER] Container limpo');
  }

  /**
   * Cria um escopo filho (útil para testes isolados)
   * @returns {DependencyInjectionContainer}
   */
  createScope() {
    const scope = new DependencyInjectionContainer();
    
    // Copia singletons e factories do pai
    this.singletons.forEach((value, key) => {
      scope.singletons.set(key, value);
    });
    
    this.factories.forEach((value, key) => {
      scope.factories.set(key, value);
    });
    
    return scope;
  }
}

// Singleton global do container
let globalContainer = null;

/**
 * Retorna a instância singleton do container
 * @returns {DependencyInjectionContainer}
 */
function getContainer() {
  if (!globalContainer) {
    globalContainer = new DependencyInjectionContainer();
  }
  return globalContainer;
}

module.exports = { DependencyInjectionContainer, getContainer };
