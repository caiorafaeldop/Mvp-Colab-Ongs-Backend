/**
 * Interface para StorageBridge
 * Define abstração para diferentes provedores de storage
 */
class IStorageBridge {
  /**
   * Faz upload de arquivo
   * @param {File} file - Arquivo a ser enviado
   * @param {Object} options - Opções do upload
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadFile(file, options = {}) {
    throw new Error('Method uploadFile must be implemented');
  }

  /**
   * Remove arquivo
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<Object>} Resultado da remoção
   */
  async deleteFile(fileId) {
    throw new Error('Method deleteFile must be implemented');
  }

  /**
   * Obtém URL do arquivo
   * @param {string} fileId - ID do arquivo
   * @param {Object} options - Opções de transformação
   * @returns {Promise<string>} URL do arquivo
   */
  async getFileUrl(fileId, options = {}) {
    throw new Error('Method getFileUrl must be implemented');
  }

  /**
   * Lista arquivos
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Array>} Lista de arquivos
   */
  async listFiles(filters = {}) {
    throw new Error('Method listFiles must be implemented');
  }

  /**
   * Obtém informações do provedor
   * @returns {Object} Informações do provedor
   */
  getProviderInfo() {
    throw new Error('Method getProviderInfo must be implemented');
  }
}

module.exports = IStorageBridge;
