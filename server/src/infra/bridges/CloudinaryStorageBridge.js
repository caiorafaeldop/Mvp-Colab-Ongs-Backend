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
          quality: 'auto:good'
        },
        resource_type: 'auto',
        ...options.cloudinaryOptions
      };

      const result = await this.adapter.uploadFile(file, cloudinaryOptions);

      console.log(`[CloudinaryStorageBridge] Upload concluído: ${result.secure_url}`);

      return {
        success: true,
        fileId: result.public_id,
        url: result.secure_url,
        originalName: file.originalname,
        size: file.size,
        format: result.format,
        width: result.width,
        height: result.height,
        provider: this.providerName,
        metadata: {
          bytes: result.bytes,
          etag: result.etag,
          version: result.version,
          createdAt: result.created_at
        }
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

      console.log(`[CloudinaryStorageBridge] Arquivo removido: ${fileId}`);

      return {
        success: true,
        fileId: fileId,
        provider: this.providerName,
        result: result.result
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
      const transformations = [];

      if (options.width || options.height) {
        transformations.push({
          width: options.width,
          height: options.height,
          crop: options.crop || 'fill'
        });
      }

      if (options.quality) {
        transformations.push({ quality: options.quality });
      }

      if (options.format) {
        transformations.push({ format: options.format });
      }

      const url = this.adapter.cloudinary.url(fileId, {
        transformation: transformations,
        secure: true
      });

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

      const searchOptions = {
        resource_type: filters.resourceType || 'image',
        type: filters.type || 'upload',
        max_results: filters.limit || 50
      };

      if (filters.folder) {
        searchOptions.prefix = filters.folder;
      }

      if (filters.tags) {
        searchOptions.tags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      }

      const result = await this.adapter.cloudinary.search
        .expression(this.buildSearchExpression(filters))
        .with_field('context')
        .with_field('tags')
        .max_results(searchOptions.max_results)
        .execute();

      const files = result.resources.map(resource => ({
        fileId: resource.public_id,
        url: resource.secure_url,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        size: resource.bytes,
        createdAt: resource.created_at,
        provider: this.providerName,
        tags: resource.tags || [],
        context: resource.context || {}
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
        'auto_tagging'
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov'],
      maxFileSize: '100MB',
      transformations: true,
      cdn: true
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
        transformations: 'N/A - Requires Admin API'
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = CloudinaryStorageBridge;
