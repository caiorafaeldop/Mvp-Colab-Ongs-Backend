const IDecorator = require('../../domain/decorators/IDecorator');

/**
 * Decorator para validação automática
 * Adiciona validação de entrada e saída para qualquer componente
 */
class ValidationDecorator extends IDecorator {
  constructor(component, validationRules = {}, options = {}) {
    super(component);
    this.rules = validationRules;
    this.options = {
      validateInput: true,
      validateOutput: false,
      throwOnValidationError: true,
      ...options
    };
  }

  /**
   * Executa operação com validação
   * @param {string} methodName - Nome do método
   * @param {...any} args - Argumentos
   * @returns {Promise<any>} Resultado validado
   */
  async execute(methodName, ...args) {
    try {
      // Validação de entrada
      if (this.options.validateInput) {
        this.validateInput(methodName, args);
      }

      // Executa método original
      const result = await this.component[methodName](...args);
      
      // Validação de saída
      if (this.options.validateOutput) {
        this.validateOutput(methodName, result);
      }

      return result;

    } catch (error) {
      if (error.name === 'ValidationError') {
        console.error(`[ValidationDecorator] Validation failed for ${methodName}:`, error.message);
        
        if (this.options.throwOnValidationError) {
          throw error;
        }
        return null;
      }
      throw error;
    }
  }

  /**
   * CHAIN OF RESPONSIBILITY PATTERN: Validação em cadeia
   * Cada validação é um handler que processa e passa para o próximo
   */
  validateInput(methodName, args) {
    const methodRules = this.rules[methodName];
    if (!methodRules || !methodRules.input) return;

    const inputRules = methodRules.input;

    // CHAIN STEP 1: Valida número de argumentos
    if (inputRules.minArgs && args.length < inputRules.minArgs) {
      throw new ValidationError(`${methodName} requires at least ${inputRules.minArgs} arguments`);
    }

    if (inputRules.maxArgs && args.length > inputRules.maxArgs) {
      throw new ValidationError(`${methodName} accepts at most ${inputRules.maxArgs} arguments`);
    }

    // CHAIN STEP 2: Valida cada argumento individualmente
    if (inputRules.args) {
      inputRules.args.forEach((rule, index) => {
        if (index < args.length) {
          this.validateArgument(args[index], rule, `${methodName} arg[${index}]`);
        }
      });
    }
  }

  /**
   * Valida resultado de saída
   */
  validateOutput(methodName, result) {
    const methodRules = this.rules[methodName];
    if (!methodRules || !methodRules.output) return;

    const outputRules = methodRules.output;
    this.validateArgument(result, outputRules, `${methodName} result`);
  }

  /**
   * Valida um argumento específico
   */
  validateArgument(value, rule, context) {
    // Validação de tipo
    if (rule.type && !this.validateType(value, rule.type)) {
      throw new ValidationError(`${context} must be of type ${rule.type}, got ${typeof value}`);
    }

    // Validação de obrigatório
    if (rule.required && (value === null || value === undefined)) {
      throw new ValidationError(`${context} is required`);
    }

    // Validação de string
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        throw new ValidationError(`${context} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        throw new ValidationError(`${context} must be at most ${rule.maxLength} characters`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        throw new ValidationError(`${context} does not match required pattern`);
      }
    }

    // Validação de número
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        throw new ValidationError(`${context} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        throw new ValidationError(`${context} must be at most ${rule.max}`);
      }
    }

    // Validação de array
    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.minItems && value.length < rule.minItems) {
        throw new ValidationError(`${context} must have at least ${rule.minItems} items`);
      }
      if (rule.maxItems && value.length > rule.maxItems) {
        throw new ValidationError(`${context} must have at most ${rule.maxItems} items`);
      }
      if (rule.itemType) {
        value.forEach((item, index) => {
          this.validateArgument(item, { type: rule.itemType }, `${context}[${index}]`);
        });
      }
    }

    // Validação de objeto
    if (rule.type === 'object' && typeof value === 'object' && value !== null) {
      if (rule.properties) {
        Object.keys(rule.properties).forEach(key => {
          this.validateArgument(value[key], rule.properties[key], `${context}.${key}`);
        });
      }
    }

    // Validação customizada
    if (rule.custom && typeof rule.custom === 'function') {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        throw new ValidationError(`${context} failed custom validation: ${customResult}`);
      }
    }
  }

  /**
   * Valida tipo de dados
   */
  validateType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'function':
        return typeof value === 'function';
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return typeof value === 'string' && /^\+?[\d\s\-\(\)]{10,}$/.test(value);
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  /**
   * Cria proxy para interceptar todas as chamadas de método
   */
  createProxy() {
    return new Proxy(this.component, {
      get: (target, prop) => {
        if (typeof target[prop] === 'function') {
          return async (...args) => {
            return await this.execute(prop, ...args);
          };
        }
        return target[prop];
      }
    });
  }

  /**
   * Adiciona regra de validação para um método
   */
  addRule(methodName, rule) {
    this.rules[methodName] = rule;
  }

  /**
   * Remove regra de validação
   */
  removeRule(methodName) {
    delete this.rules[methodName];
  }

  /**
   * Obtém regras de validação
   */
  getRules() {
    return { ...this.rules };
  }
}

/**
 * Classe de erro de validação
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

module.exports = { ValidationDecorator, ValidationError };
