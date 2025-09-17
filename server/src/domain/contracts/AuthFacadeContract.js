/**
 * Interface para AuthFacade
 * Define operações completas de autenticação no marketplace
 */
class IAuthFacade {
  /**
   * Registro completo com validações e boas-vindas
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Resultado do registro com tokens
   */
  async registerComplete(userData) {
    throw new Error('Method registerComplete must be implemented');
  }

  /**
   * Login completo com eventos e métricas
   * @param {string} email - Email do usuário
   * @param {string} password - Senha
   * @returns {Promise<Object>} Resultado do login com tokens
   */
  async loginComplete(email, password) {
    throw new Error('Method loginComplete must be implemented');
  }

  /**
   * Refresh de token com validações
   * @param {string} refreshToken - Token de refresh
   * @returns {Promise<Object>} Novos tokens
   */
  async refreshTokenComplete(refreshToken) {
    throw new Error('Method refreshTokenComplete must be implemented');
  }

  /**
   * Logout completo com limpeza
   * @param {string} userId - ID do usuário
   * @param {string} refreshToken - Token de refresh
   * @returns {Promise<Object>} Resultado do logout
   */
  async logoutComplete(userId, refreshToken) {
    throw new Error('Method logoutComplete must be implemented');
  }

  /**
   * Validação completa de sessão
   * @param {string} accessToken - Token de acesso
   * @returns {Promise<Object>} Dados do usuário validado
   */
  async validateSessionComplete(accessToken) {
    throw new Error('Method validateSessionComplete must be implemented');
  }
}

module.exports = IAuthFacade;
