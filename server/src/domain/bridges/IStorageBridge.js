/**
 * Interface/Contrato para Storage Bridges
 * Define operações que um bridge de armazenamento deve expor
 */
class IStorageBridge {
  /**
   * Upload de arquivo
   * @param {Object} file - Arquivo (ex: objeto do Multer)
   * @param {Object} options - Opções específicas do provedor
   * @returns {Promise<Object>} Resultado padronizado
   */
  async uploadFile(file, options = {}) {
    throw new Error('Method uploadFile must be implemented by concrete bridge');
  }

  /**
   * Remoção de arquivo
   * @param {string} fileId - Identificador do arquivo no provedor
   * @returns {Promise<Object>} Resultado padronizado
   */
  async deleteFile(fileId) {
    throw new Error('Method deleteFile must be implemented by concrete bridge');
  }

  /**
   * Obter URL de acesso ao arquivo
   * @param {string} fileId
   * @param {Object} options
   * @returns {Promise<string>} URL
   */
  async getFileUrl(fileId, options = {}) {
    throw new Error('Method getFileUrl must be implemented by concrete bridge');
  }

  /**
   * Listar arquivos do provider
   * @param {Object} filters
   * @returns {Promise<Array>} Lista de arquivos
   */
  async listFiles(filters = {}) {
    throw new Error('Method listFiles must be implemented by concrete bridge');
  }

  /**
   * Informações do provedor (metadados)
   * @returns {Object}
   */
  getProviderInfo() {
    throw new Error('Method getProviderInfo must be implemented by concrete bridge');
  }
}

module.exports = IStorageBridge;
