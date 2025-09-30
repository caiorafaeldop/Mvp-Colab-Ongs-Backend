const IStorageBridge = require('../../domain/bridges/IStorageBridge');

/**
 * Bridge para Cloudinary Storage
 * Implementação específica para provedor Cloudinary
 */
class CloudinaryStorageBridge extends IStorageBridge {
  constructor(cloudinaryAdapter) {
    super();
    this.adapter = cloudinaryAdapter;
    this.providerName = 'Cloudinary';
  }

  /**
   * Faz upload de arquivo
   * @param {File} file - Arquivo a ser enviado
   * @param {Object} options - Opções do upload
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadFile(file, options = {}) {
    try {
      console.log(`[CloudinaryStorageBridge] Iniciando upload: ${file.originalname}`);

      const cloudinaryOptions = {
        folder: options.folder || 'marketplace-ongs',
        transformation: options.transformation || {
          width: 800,
          height: 600,
          crop: 'fill',
          quality: 'auto:good',
        },
        resource_type: 'auto',
        ...options.cloudinaryOptions,
      };

      const result = await this.adapter.uploadFile(file, cloudinaryOptions);

      if (!result || result.success === false) {
        const msg = result?.error || 'Adapter upload failed';
        throw new Error(msg);
      }

      const d = result.data;
      console.log(`[CloudinaryStorageBridge] Upload concluído: ${d.url}`);

      return {
        success: true,
        fileId: d.id,
        url: d.url,
        originalName: file.originalname,
        size: d.size ?? file.size,
        format: d.format,
        width: d.width,
        height: d.height,
        provider: this.providerName,
        metadata: {
          bytes: d.size,
          folder: d.folder,
          requestId: result.metadata?.requestId,
          timestamp: result.metadata?.timestamp,
        },
      };
    } catch (error) {
      console.error('[CloudinaryStorageBridge] Erro no upload:', error.message);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Remove arquivo
   * @param {string} fileId - ID do arquivo (public_id)
   * @returns {Promise<Object>} Resultado da remoção
   */
  async deleteFile(fileId) {
    try {
      console.log(`[CloudinaryStorageBridge] Removendo arquivo: ${fileId}`);

      const result = await this.adapter.deleteFile(fileId);

      if (!result || result.success === false) {
        const msg = result?.error || 'Adapter delete failed';
        throw new Error(msg);
      }

      console.log(`[CloudinaryStorageBridge] Arquivo removido: ${fileId}`);

      return {
        success: true,
        fileId: fileId,
        provider: this.providerName,
        result: result.data?.deleted === true ? 'ok' : 'not_found',
      };
    } catch (error) {
      console.error('[CloudinaryStorageBridge] Erro na remoção:', error.message);
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  }

  /**
   * Obtém URL do arquivo
   * @param {string} fileId - ID do arquivo
   * @param {Object} options - Opções de transformação
   * @returns {Promise<string>} URL do arquivo
   */
  async getFileUrl(fileId, options = {}) {
    try {
      const url = await this.adapter.getFileUrl(fileId, options);
      return url;
    } catch (error) {
      console.error('[CloudinaryStorageBridge] Erro ao gerar URL:', error.message);
      throw new Error(`Failed to generate URL: ${error.message}`);
    }
  }

  /**
   * Lista arquivos
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Array>} Lista de arquivos
   */
  async listFiles(filters = {}) {
    try {
      console.log('[CloudinaryStorageBridge] Listando arquivos...');

      const result = await this.adapter.listFiles({
        resourceType: filters.resourceType,
        maxResults: filters.limit,
        cloudinaryFilters: {},
        folder: filters.folder,
      });

      if (!result || result.success === false) {
        const msg = result?.error || 'Adapter list files failed';
        throw new Error(msg);
      }

      const files = result.data.files.map((resource) => ({
        fileId: resource.id,
        url: resource.url,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        size: resource.size,
        createdAt: resource.createdAt,
        provider: this.providerName,
        folder: resource.folder,
      }));

      console.log(`[CloudinaryStorageBridge] ${files.length} arquivos encontrados`);

      return files;
    } catch (error) {
      console.error('[CloudinaryStorageBridge] Erro ao listar arquivos:', error.message);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Constrói expressão de busca para Cloudinary
   * @param {Object} filters - Filtros
   * @returns {string} Expressão de busca
   */
  buildSearchExpression(filters) {
    const expressions = [];

    if (filters.folder) {
      expressions.push(`folder:${filters.folder}`);
    }

    if (filters.format) {
      expressions.push(`format:${filters.format}`);
    }

    if (filters.minWidth) {
      expressions.push(`width>=${filters.minWidth}`);
    }

    if (filters.maxWidth) {
      expressions.push(`width<=${filters.maxWidth}`);
    }

    if (filters.createdAfter) {
      expressions.push(`created_at>=${filters.createdAfter}`);
    }

    return expressions.length > 0 ? expressions.join(' AND ') : 'resource_type:image';
  }

  /**
   * Obtém informações do provedor
   * @returns {Object} Informações do provedor
   */
  getProviderInfo() {
    return {
      name: this.providerName,
      type: 'cloud',
      features: [
        'image_transformation',
        'video_processing',
        'auto_optimization',
        'cdn_delivery',
        'face_detection',
        'auto_tagging',
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov'],
      maxFileSize: '100MB',
      transformations: true,
      cdn: true,
    };
  }

  /**
   * Obtém estatísticas de uso
   * @returns {Promise<Object>} Estatísticas
   */
  async getUsageStats() {
    try {
      // Note: Cloudinary Admin API seria necessária para estatísticas reais
      return {
        provider: this.providerName,
        totalFiles: 'N/A - Requires Admin API',
        totalStorage: 'N/A - Requires Admin API',
        bandwidth: 'N/A - Requires Admin API',
        transformations: 'N/A - Requires Admin API',
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Verifica saúde do bridge
   * @returns {Promise<Object>} Status de saúde
   */
  async healthCheck() {
    try {
      // Tenta listar arquivos para verificar conectividade
      const result = await this.listFiles({ limit: 1 });

      return {
        status: 'healthy',
        provider: this.providerName,
        accessible: true,
        apiConnected: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.providerName,
        accessible: false,
        apiConnected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = CloudinaryStorageBridge;
