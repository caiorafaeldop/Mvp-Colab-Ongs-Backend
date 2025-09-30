const { logger } = require('../../infra/logger');

/**
 * TEMPLATE METHOD PATTERN - Classe base abstrata
 * Define o esqueleto de algoritmos com passos imutáveis e ganchos customizáveis
 */

/**
 * Classe base abstrata que implementa o padrão Template Method
 * Define a estrutura comum de processamento com hooks para customização
 */
class BaseTemplate {
  constructor(name) {
    this.name = name;
    this.context = {};
    this.startTime = null;
    this.requestLogger = logger;
  }
  
  /**
   * TEMPLATE METHOD - Método principal que define o algoritmo
   * Este método NÃO deve ser sobrescrito pelas subclasses
   * @param {Object} input - Dados de entrada
   * @param {Object} options - Opções de configuração
   * @returns {Object} Resultado do processamento
   */
  async execute(input, options = {}) {
    this.startTime = Date.now();
    this.context = { input, options, result: null, metadata: {} };
    
    try {
      // Hook: Inicialização (opcional)
      await this.beforeProcess();
      
      // Passo 1: Validação (obrigatório)
      this.requestLogger.debug(`[${this.name}] Iniciando validação`, {
        template: this.name,
        step: 'validation'
      });
      await this.validate();
      
      // Hook: Pós-validação (opcional)
      await this.afterValidation();
      
      // Passo 2: Preparação (obrigatório)
      this.requestLogger.debug(`[${this.name}] Preparando dados`, {
        template: this.name,
        step: 'preparation'
      });
      await this.prepare();
      
      // Hook: Pré-processamento (opcional)
      await this.beforeMainProcess();
      
      // Passo 3: Processamento principal (obrigatório)
      this.requestLogger.debug(`[${this.name}] Executando processamento principal`, {
        template: this.name,
        step: 'main_process'
      });
      this.context.result = await this.process();
      
      // Hook: Pós-processamento (opcional)
      await this.afterMainProcess();
      
      // Passo 4: Finalização (obrigatório)
      this.requestLogger.debug(`[${this.name}] Finalizando`, {
        template: this.name,
        step: 'finalization'
      });
      await this.finalize();
      
      // Hook: Conclusão (opcional)
      await this.afterProcess();
      
      const duration = Date.now() - this.startTime;
      this.requestLogger.info(`[${this.name}] Template executado com sucesso`, {
        template: this.name,
        duration: `${duration}ms`,
        success: true
      });
      
      return this.buildResult();
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      this.requestLogger.error(`[${this.name}] Erro na execução do template`, {
        template: this.name,
        error: error.message,
        duration: `${duration}ms`,
        step: this.getCurrentStep(),
        stack: error.stack
      });
      
      // Hook: Tratamento de erro (opcional)
      await this.onError(error);
      
      throw error;
    }
  }
  
  // ==========================================
  // MÉTODOS ABSTRATOS (devem ser implementados pelas subclasses)
  // ==========================================
  
  /**
   * Valida os dados de entrada
   * @abstract
   */
  async validate() {
    throw new Error(`Method validate() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Prepara os dados para processamento
   * @abstract
   */
  async prepare() {
    throw new Error(`Method prepare() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Executa o processamento principal
   * @abstract
   * @returns {*} Resultado do processamento
   */
  async process() {
    throw new Error(`Method process() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Finaliza o processamento
   * @abstract
   */
  async finalize() {
    throw new Error(`Method finalize() must be implemented by ${this.constructor.name}`);
  }
  
  // ==========================================
  // HOOKS OPCIONAIS (podem ser sobrescritos pelas subclasses)
  // ==========================================
  
  /**
   * Hook executado antes de iniciar o processamento
   */
  async beforeProcess() {
    // Implementação padrão vazia
  }
  
  /**
   * Hook executado após a validação
   */
  async afterValidation() {
    // Implementação padrão vazia
  }
  
  /**
   * Hook executado antes do processamento principal
   */
  async beforeMainProcess() {
    // Implementação padrão vazia
  }
  
  /**
   * Hook executado após o processamento principal
   */
  async afterMainProcess() {
    // Implementação padrão vazia
  }
  
  /**
   * Hook executado após todo o processamento
   */
  async afterProcess() {
    // Implementação padrão vazia
  }
  
  /**
   * Hook executado quando ocorre um erro
   * @param {Error} error - Erro ocorrido
   */
  async onError(error) {
    // Implementação padrão vazia
  }
  
  // ==========================================
  // MÉTODOS UTILITÁRIOS
  // ==========================================
  
  /**
   * Constrói o resultado final
   * @returns {Object} Resultado formatado
   */
  buildResult() {
    return {
      success: true,
      data: this.context.result,
      metadata: {
        template: this.name,
        duration: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
        ...this.context.metadata
      }
    };
  }
  
  /**
   * Obtém o passo atual do processamento
   * @returns {string} Nome do passo atual
   */
  getCurrentStep() {
    return this.context.currentStep || 'unknown';
  }
  
  /**
   * Define o passo atual
   * @param {string} step - Nome do passo
   */
  setCurrentStep(step) {
    this.context.currentStep = step;
  }
  
  /**
   * Adiciona metadados ao contexto
   * @param {string} key - Chave do metadado
   * @param {*} value - Valor do metadado
   */
  addMetadata(key, value) {
    this.context.metadata[key] = value;
  }
  
  /**
   * Obtém dados do contexto
   * @param {string} key - Chave dos dados
   * @returns {*} Valor dos dados
   */
  getContextData(key) {
    return this.context[key];
  }
  
  /**
   * Define dados no contexto
   * @param {string} key - Chave dos dados
   * @param {*} value - Valor dos dados
   */
  setContextData(key, value) {
    this.context[key] = value;
  }
  
  /**
   * Define o logger contextual
   * @param {Object} logger - Logger contextual
   */
  setLogger(logger) {
    this.requestLogger = logger;
  }
}

/**
 * Factory para criar templates
 */
class TemplateFactory {
  static templates = new Map();
  
  /**
   * Registra um template
   * @param {string} name - Nome do template
   * @param {Class} TemplateClass - Classe do template
   */
  static register(name, TemplateClass) {
    this.templates.set(name, TemplateClass);
  }
  
  /**
   * Cria uma instância de template
   * @param {string} name - Nome do template
   * @param {Object} options - Opções de configuração
   * @returns {BaseTemplate} Instância do template
   */
  static create(name, options = {}) {
    const TemplateClass = this.templates.get(name);
    if (!TemplateClass) {
      throw new Error(`Template '${name}' not found`);
    }
    
    return new TemplateClass(options);
  }
  
  /**
   * Lista templates disponíveis
   * @returns {Array<string>} Nomes dos templates
   */
  static getAvailableTemplates() {
    return Array.from(this.templates.keys());
  }
}

module.exports = {
  BaseTemplate,
  TemplateFactory
};
