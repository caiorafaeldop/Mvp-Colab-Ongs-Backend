/**
 * Interface para adapters de Storage
 * Define o contrato padrão que todos os provedores de armazenamento devem seguir
 */
class IStorageAdapter {
  /**
   * Faz upload de um arquivo
   * @param {Object} file - Arquivo a ser enviado
   * @param {Object} options - Opções de upload
   * @returns {Promise<Object>} Resposta padronizada
   */
  async uploadFile(file, options = {}) {
    throw new Error('Method uploadFile must be implemented by concrete adapter');
  }
  
  /**
   * Remove um arquivo do storage
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<Object>} Resposta padronizada
   */
  async deleteFile(fileId) {
    throw new Error('Method deleteFile must be implemented by concrete adapter');
  }
  
  /**
   * Obtém a URL de um arquivo
   * @param {string} fileId - ID do arquivo
   * @param {Object} options - Opções de transformação
   * @returns {Promise<string>} URL do arquivo
   */
  async getFileUrl(fileId, options = {}) {
    throw new Error('Method getFileUrl must be implemented by concrete adapter');
  }

  /**
   * Retorna o nome do provedor de storage
   * @returns {string} Nome do provedor
   */
  getProviderName() {
    throw new Error('Method getProviderName must be implemented by concrete adapter');
  }

  /**
   * Verifica se variáveis de ambiente/config estão OK
   * @returns {boolean}
   */
  validateConfiguration() {
    throw new Error('Method validateConfiguration must be implemented by concrete adapter');
  }

  /**
   * Health check simples (conexão/credenciais)
   * @returns {Promise<{ success: boolean, details?: any }>}
   */
  async healthCheck() {
    throw new Error('Method healthCheck must be implemented by concrete adapter');
  }
}

module.exports = IStorageAdapter;
