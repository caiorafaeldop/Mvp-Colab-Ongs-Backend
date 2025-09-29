const { createUserSchema } = require('../../domain/validators/schemas/userSchemas');

/**
 * DTO para criação de usuário
 * Encapsula validação e transformação de dados para criação de usuários
 */
class CreateUserDTO {
  constructor(data) {
    // Valida e transforma os dados usando Zod
    const validatedData = createUserSchema.parse(data);
    
    // Atribui propriedades validadas
    Object.assign(this, validatedData);
  }

  /**
   * Método estático para validação sem instanciar
   * @param {Object} data - Dados a serem validados
   * @returns {Object} Dados validados
   */
  static validate(data) {
    return createUserSchema.parse(data);
  }

  /**
   * Método estático para validação segura (não lança exceção)
   * @param {Object} data - Dados a serem validados
   * @returns {Object} { success: boolean, data?: Object, error?: ZodError }
   */
  static safeParse(data) {
    return createUserSchema.safeParse(data);
  }

  /**
   * Converte DTO para objeto plano (para persistência)
   * @returns {Object} Objeto com dados do usuário
   */
  toPlainObject() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      phone: this.phone,
      organizationType: this.organizationType,
      description: this.description,
      address: this.address
    };
  }

  /**
   * Converte DTO para objeto sem dados sensíveis (para resposta)
   * @returns {Object} Objeto sem senha
   */
  toSafeObject() {
    const { password, ...safeData } = this.toPlainObject();
    return safeData;
  }

  /**
   * Valida se email já não existe (será usado no Use Case)
   * @returns {string} Email normalizado
   */
  getEmail() {
    return this.email;
  }

  /**
   * Retorna dados para hash da senha
   * @returns {string} Senha em texto plano (será hasheada no Use Case)
   */
  getPassword() {
    return this.password;
  }

  /**
   * Retorna dados formatados para log (sem informações sensíveis)
   * @returns {Object} Dados seguros para log
   */
  toLogObject() {
    return {
      email: this.email,
      name: this.name,
      organizationType: this.organizationType,
      hasPhone: !!this.phone,
      hasAddress: !!this.address
    };
  }
}

module.exports = CreateUserDTO;
