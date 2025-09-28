const IUploadFacade = require('../../domain/facades/IUploadFacade');

/**
 * Facade para operações completas de upload
 * Simplifica processo de upload com validação, storage e eventos
 */
class UploadFacade extends IUploadFacade {
  constructor(storageAdapter, fileRepository, eventManager) {
    super();
    this.storageAdapter = storageAdapter;
    this.fileRepository = fileRepository;
    this.eventManager = eventManager;
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
  }

  /**
   * Upload completo de imagem de produto
   * @param {File} file - Arquivo de imagem
   * @param {Object} user - Usuário fazendo upload
   * @param {Object} options - Opções do upload
   * @returns {Promise<Object>} Resultado do upload com URL e metadata
   */
  async uploadProductImage(file, user, options = {}) {
    try {
      console.log(`[UploadFacade] Iniciando upload para usuário: ${user.name}`);

      // 1. Validações básicas
      this.validateFile(file);
      this.validateUser(user);

      // 2. Configurações do upload
      const uploadOptions = {
        folder: 'products',
        transformation: {
          width: 800,
          height: 600,
          crop: 'fill',
          quality: 'auto:good'
        },
        ...options
      };

      // 3. Faz upload para storage
      const uploadResult = await this.storageAdapter.uploadFile(file, uploadOptions);

      // 4. Salva metadata no banco
      const fileMetadata = {
        originalName: file.originalname,
        fileName: uploadResult.public_id,
        url: uploadResult.secure_url,
        size: file.size,
        mimeType: file.mimetype,
        uploadedBy: user.id,
        folder: uploadOptions.folder,
        width: uploadResult.width,
        height: uploadResult.height
      };

      const savedFile = await this.fileRepository.create(fileMetadata);

      // 5. Emite evento de upload
      if (this.eventManager) {
        await this.eventManager.emit('file.upload', {
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          userId: user.id,
          success: true,
          duration: Date.now() - (uploadResult.created_at ? new Date(uploadResult.created_at).getTime() : Date.now())
        });
      }

      console.log(`[UploadFacade] Upload concluído: ${uploadResult.secure_url}`);

      return {
        success: true,
        file: {
          id: savedFile.id,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          originalName: file.originalname,
          size: file.size,
          dimensions: {
            width: uploadResult.width,
            height: uploadResult.height
          }
        },
        message: 'Imagem enviada com sucesso!'
      };

    } catch (error) {
      console.error('[UploadFacade] Erro no upload:', error.message);
      
      if (this.eventManager) {
        await this.eventManager.emit('file.upload', {
          fileName: file?.originalname || 'unknown',
          fileSize: file?.size || 0,
          fileType: file?.mimetype || 'unknown',
          userId: user.id,
          success: false,
          error: error.message
        });
      }

      throw error;
    }
  }

  /**
   * Upload múltiplo de imagens
   * @param {Array<File>} files - Arquivos de imagem
   * @param {Object} user - Usuário fazendo upload
   * @param {Object} options - Opções do upload
   * @returns {Promise<Object>} Resultado dos uploads
   */
  async uploadMultipleImages(files, user, options = {}) {
    try {
      console.log(`[UploadFacade] Upload múltiplo: ${files.length} arquivos`);

      if (!files || files.length === 0) {
        throw new Error('Nenhum arquivo fornecido');
      }

      if (files.length > 10) {
        throw new Error('Máximo de 10 imagens por vez');
      }

      // Valida todos os arquivos antes de fazer upload
      files.forEach(file => this.validateFile(file));

      const uploadPromises = files.map(async (file, index) => {
        try {
          const result = await this.uploadProductImage(file, user, {
            ...options,
            folder: `${options.folder || 'products'}/${user.id}`
          });
          return { index, success: true, result };
        } catch (error) {
          return { index, success: false, error: error.message };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      console.log(`[UploadFacade] Upload múltiplo concluído: ${successful.length}/${files.length} sucessos`);

      return {
        success: failed.length === 0,
        totalFiles: files.length,
        successful: successful.length,
        failed: failed.length,
        uploads: successful.map(r => r.result.file),
        errors: failed.map(r => ({ index: r.index, error: r.error })),
        message: failed.length === 0 
          ? 'Todas as imagens foram enviadas com sucesso!'
          : `${successful.length} imagens enviadas, ${failed.length} falharam`
      };

    } catch (error) {
      console.error('[UploadFacade] Erro no upload múltiplo:', error.message);
      throw error;
    }
  }

  /**
   * Remove imagem com limpeza completa
   * @param {string} imageUrl - URL da imagem
   * @param {Object} user - Usuário removendo
   * @returns {Promise<Object>} Resultado da remoção
   */
  async deleteImage(imageUrl, user) {
    try {
      console.log(`[UploadFacade] Removendo imagem: ${imageUrl}`);

      // 1. Busca metadata da imagem
      const fileRecord = await this.fileRepository.findByUrl(imageUrl);
      
      if (fileRecord && fileRecord.uploadedBy !== user.id) {
        throw new Error('Você não tem permissão para remover esta imagem');
      }

      // 2. Remove do storage
      if (fileRecord?.fileName) {
        await this.storageAdapter.deleteFile(fileRecord.fileName);
      }

      // 3. Remove do banco
      if (fileRecord) {
        await this.fileRepository.delete(fileRecord.id);
      }

      console.log(`[UploadFacade] Imagem removida com sucesso`);

      return {
        success: true,
        message: 'Imagem removida com sucesso!'
      };

    } catch (error) {
      console.error('[UploadFacade] Erro ao remover imagem:', error.message);
      throw error;
    }
  }

  /**
   * Valida arquivo de upload
   * @param {File} file - Arquivo a ser validado
   */
  validateFile(file) {
    if (!file) {
      throw new Error('Arquivo não fornecido');
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new Error(`Tipo de arquivo não permitido. Aceitos: ${this.allowedTypes.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (file.size === 0) {
      throw new Error('Arquivo está vazio');
    }
  }

  /**
   * Valida usuário
   * @param {Object} user - Usuário a ser validado
   */
  validateUser(user) {
    if (!user || !user.id) {
      throw new Error('Usuário não identificado');
    }

    if (user.userType !== 'organization') {
      throw new Error('Apenas ONGs podem fazer upload de imagens de produtos');
    }
  }
}

module.exports = UploadFacade;
