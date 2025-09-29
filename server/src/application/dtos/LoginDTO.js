const { loginSchema } = require('../../domain/validators/schemas/userSchemas');

/**
 * DTO para login de usuário
 * Encapsula validação e transformação de dados para autenticação
 */
class LoginDTO {
  constructor(data) {
    // Valida e transforma os dados usando Zod
    const validatedData = loginSchema.parse(data);
    
    // Atribui propriedades validadas
    this.email = validatedData.email;
    this.password = validatedData.password;
  }

  /**
   * Método estático para validação sem instanciar
   * @param {Object} data - Dados a serem validados
   * @returns {Object} Dados validados
   */
  static validate(data) {
    return loginSchema.parse(data);
  }

  /**
   * Método estático para validação segura (não lança exceção)
   * @param {Object} data - Dados a serem validados
   * @returns {Object} { success: boolean, data?: Object, error?: ZodError }
   */
  static safeParse(data) {
    return loginSchema.safeParse(data);
  }

  /**
   * Retorna email normalizado para busca
   * @returns {string} Email em lowercase
   */
  getEmail() {
    return this.email;
  }

  /**
   * Retorna senha para verificação
   * @returns {string} Senha em texto plano
   */
  getPassword() {
    return this.password;
  }

  /**
   * Converte DTO para objeto plano
   * @returns {Object} Objeto com dados de login
   */
  toPlainObject() {
    return {
      email: this.email,
      password: this.password
    };
  }

  /**
   * Retorna dados seguros para log (sem senha)
   * @returns {Object} Dados seguros para log
   */
  toLogObject() {
    return {
      email: this.email,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Retorna dados para auditoria
   * @param {string} userAgent - User agent do request
   * @param {string} ip - IP do usuário
   * @returns {Object} Dados para auditoria
   */
  toAuditObject(userAgent, ip) {
    return {
      email: this.email,
      userAgent,
      ip,
      timestamp: new Date().toISOString(),
      action: 'login_attempt'
    };
  }
}

module.exports = LoginDTO;
