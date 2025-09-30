const StorageAdapterContract = require('../../domain/contracts/StorageAdapterContract');
const cloudinary = require('../../main/config/cloudinary');
const { logger } = require('../../infra/logger');

/**
 * Adapter para Cloudinary que implementa IStorageAdapter
 * Adapta as operações do Cloudinary para a interface padronizada do domínio
 */
class CloudinaryAdapter extends StorageAdapterContract {
  constructor() {
    super();
    this.cloudinary = cloudinary;
  }

  /**
   * Faz upload de um arquivo para o Cloudinary
   * @param {Object} file - Arquivo (buffer, stream ou path)
   * @param {Object} options - Opções de upload
   * @returns {Promise<Object>} Resposta padronizada
   */
  async uploadFile(file, options = {}) {
    try {
      const uploadOptions = {
        folder: options.folder || 'ongs-colab',
        resource_type: options.resourceType || 'auto',
        ...options.cloudinaryOptions
      };

      let result;
      if (file && typeof file === 'object' && file.buffer) {
        // Upload de arquivo Multer (possui buffer, originalname)
        result = await new Promise((resolve, reject) => {
          this.cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, res) => {
              if (error) reject(error);
              else resolve(res);
            }
          ).end(file.buffer);
        });
      } else if (Buffer.isBuffer(file)) {
        // Upload de buffer
        result = await new Promise((resolve, reject) => {
          this.cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, res) => {
              if (error) reject(error);
              else resolve(res);
            }
          ).end(file);
        });
      } else if (typeof file === 'string') {
        // Upload de path ou base64
        result = await this.cloudinary.uploader.upload(file, uploadOptions);
      } else {
        throw new Error('Unsupported file format');
      }

      return {
        success: true,
        data: {
          id: result.public_id,
          url: result.secure_url,
          originalUrl: result.url,
          format: result.format,
          size: result.bytes,
          width: result.width,
          height: result.height,
          folder: result.folder
        },
        error: null,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          requestId: result.public_id
        }
      };
    } catch (error) {
      logger.error('[CLOUDINARY ADAPTER] Upload failed', { message: error.message });
      return {
        success: false,
        data: null,
        error: `Upload failed: ${error.message}`,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          requestId: null
        }
      };
    }
  }

  /**
   * Remove um arquivo do Cloudinary
   * @param {string} fileId - Public ID do arquivo no Cloudinary
   * @returns {Promise<Object>} Resposta padronizada
   */
  async deleteFile(fileId) {
    try {
      const result = await this.cloudinary.uploader.destroy(fileId);
      
      return {
        success: result.result === 'ok',
        data: { deleted: result.result === 'ok' },
        error: result.result !== 'ok' ? `Delete failed: ${result.result}` : null,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          requestId: fileId
        }
      };
    } catch (error) {
      logger.error('[CLOUDINARY ADAPTER] Delete failed', { fileId, message: error.message });
      return {
        success: false,
        data: null,
        error: `Delete failed: ${error.message}`,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          requestId: fileId
        }
      };
    }
  }

  /**
   * Obtém a URL de um arquivo com transformações opcionais
   * @param {string} fileId - Public ID do arquivo
   * @param {Object} options - Opções de transformação
   * @returns {Promise<string>} URL do arquivo
   */
  async getFileUrl(fileId, options = {}) {
    try {
      const transformations = {};
      
      if (options.width) transformations.width = options.width;
      if (options.height) transformations.height = options.height;
      if (options.crop) transformations.crop = options.crop;
      if (options.quality) transformations.quality = options.quality;
      if (options.format) transformations.format = options.format;

      const url = this.cloudinary.url(fileId, {
        secure: true,
        ...transformations
      });

      return url;
    } catch (error) {
      logger.error('[CLOUDINARY ADAPTER] Failed to generate URL', { fileId, message: error.message });
      throw new Error(`Failed to generate URL: ${error.message}`);
    }
  }

  /**
   * Retorna o nome do provedor
   * @returns {string} Nome do provedor
   */
  getProviderName() {
    return 'cloudinary';
  }

  /**
   * Lista arquivos com filtros (método adicional específico do Cloudinary)
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Lista de arquivos
   */
  async listFiles(filters = {}) {
    try {
      const searchOptions = {
        resource_type: filters.resourceType || 'image',
        max_results: filters.maxResults || 50,
        ...filters.cloudinaryFilters
      };

      if (filters.folder) {
        searchOptions.expression = `folder:${filters.folder}`;
      }

      const result = await this.cloudinary.search
        .expression(searchOptions.expression || '*')
        .max_results(searchOptions.max_results)
        .execute();

      return {
        success: true,
        data: {
          files: result.resources.map(resource => ({
            id: resource.public_id,
            url: resource.secure_url,
            format: resource.format,
            size: resource.bytes,
            createdAt: resource.created_at,
            folder: resource.folder
          })),
          totalCount: result.total_count
        },
        error: null,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          requestId: 'list-files'
        }
      };
    } catch (error) {
      logger.error('[CLOUDINARY ADAPTER] List files failed', { message: error.message });
      return {
        success: false,
        data: null,
        error: `List files failed: ${error.message}`,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          requestId: 'list-files'
        }
      };
    }
  }

  /**
   * Verifica se variáveis de ambiente estão configuradas
   */
  validateConfiguration() {
    try {
      return !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY && !!process.env.CLOUDINARY_API_SECRET;
    } catch (error) {
      logger.error('[CLOUDINARY ADAPTER] Configuração inválida', error);
      return false;
    }
  }

  /**
   * Health check simples consultando 1 recurso
   */
  async healthCheck() {
    try {
      const res = await this.cloudinary.search.expression('*').max_results(1).execute();
      return { success: true, details: { count: res.total_count } };
    } catch (error) {
      logger.warn('[CLOUDINARY ADAPTER] Health check falhou', { message: error.message });
      return { success: false, details: error.message };
    }
  }
}

module.exports = CloudinaryAdapter;
