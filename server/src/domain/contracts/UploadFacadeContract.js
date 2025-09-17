/**
 * Interface para UploadFacade
 * Define operações completas de upload no marketplace
 */
class IUploadFacade {
  /**
   * Upload completo de imagem de produto
   * @param {File} file - Arquivo de imagem
   * @param {Object} user - Usuário fazendo upload
   * @param {Object} options - Opções do upload
   * @returns {Promise<Object>} Resultado do upload com URL e metadata
   */
  async uploadProductImage(file, user, options = {}) {
    throw new Error('Method uploadProductImage must be implemented');
  }

  /**
   * Upload múltiplo de imagens
   * @param {Array<File>} files - Arquivos de imagem
   * @param {Object} user - Usuário fazendo upload
   * @param {Object} options - Opções do upload
   * @returns {Promise<Object>} Resultado dos uploads
   */
  async uploadMultipleImages(files, user, options = {}) {
    throw new Error('Method uploadMultipleImages must be implemented');
  }

  /**
   * Remove imagem com limpeza completa
   * @param {string} imageUrl - URL da imagem
   * @param {Object} user - Usuário removendo
   * @returns {Promise<Object>} Resultado da remoção
   */
  async deleteImage(imageUrl, user) {
    throw new Error('Method deleteImage must be implemented');
  }
}

module.exports = IUploadFacade;
