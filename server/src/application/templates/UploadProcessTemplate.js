const { BaseTemplate } = require('./BaseTemplate');
const { logger } = require('../../infra/logger');

/**
 * TEMPLATE METHOD - Template para processamento de uploads
 * Define o fluxo padrão: validar → processar → salvar → cleanup
 */

class UploadProcessTemplate extends BaseTemplate {
  constructor(options = {}) {
    super('UploadProcess');
    this.storageAdapter = options.storageAdapter;
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'];
    this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB
    this.folder = options.folder || 'uploads';
  }

  /**
   * Valida o arquivo de upload
   */
  async validate() {
    this.setCurrentStep('validation');
    const { file } = this.context.input;

    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    // Validar tipo de arquivo
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new Error(
        `Tipo de arquivo não permitido. Tipos aceitos: ${this.allowedTypes.join(', ')}`
      );
    }

    // Validar tamanho
    if (file.size > this.maxSize) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${this.maxSize / 1024 / 1024}MB`);
    }

    // Validar integridade do arquivo
    await this.validateFileIntegrity(file);

    this.requestLogger.debug('Arquivo validado com sucesso', {
      template: this.name,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  /**
   * Prepara os dados para upload
   */
  async prepare() {
    this.setCurrentStep('preparation');
    const { file, metadata = {} } = this.context.input;

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.originalname.split('.').pop();
    const uniqueFilename = `${timestamp}_${randomString}.${extension}`;

    // Preparar metadados
    const uploadMetadata = {
      originalName: file.originalname,
      filename: uniqueFilename,
      mimetype: file.mimetype,
      size: file.size,
      folder: this.folder,
      uploadedAt: new Date().toISOString(),
      ...metadata,
    };

    this.setContextData('uploadMetadata', uploadMetadata);
    this.setContextData('processedFile', {
      ...file,
      filename: uniqueFilename,
    });

    this.requestLogger.debug('Dados preparados para upload', {
      template: this.name,
      filename: uniqueFilename,
      folder: this.folder,
    });
  }

  /**
   * Executa o upload do arquivo
   */
  async process() {
    this.setCurrentStep('main_process');
    const processedFile = this.getContextData('processedFile');
    const uploadMetadata = this.getContextData('uploadMetadata');

    if (!this.storageAdapter) {
      throw new Error('Storage adapter não configurado');
    }

    // Executar upload
    const uploadResult = await this.storageAdapter.uploadFile(
      processedFile,
      uploadMetadata.folder,
      {
        filename: uploadMetadata.filename,
        metadata: uploadMetadata,
      }
    );

    this.requestLogger.info('Upload executado com sucesso', {
      template: this.name,
      filename: uploadMetadata.filename,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    });

    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      filename: uploadMetadata.filename,
      originalName: uploadMetadata.originalName,
      size: uploadMetadata.size,
      mimetype: uploadMetadata.mimetype,
      folder: uploadMetadata.folder,
      uploadedAt: uploadMetadata.uploadedAt,
    };
  }

  /**
   * Finaliza o processamento
   */
  async finalize() {
    this.setCurrentStep('finalization');
    const result = this.context.result;

    // Adicionar metadados finais
    this.addMetadata('uploadSuccess', true);
    this.addMetadata('fileUrl', result.url);
    this.addMetadata('fileSize', result.size);

    // Hook para persistir informações no banco de dados
    await this.persistUploadInfo(result);

    this.requestLogger.debug('Upload finalizado', {
      template: this.name,
      url: result.url,
    });
  }

  // ==========================================
  // HOOKS CUSTOMIZÁVEIS
  // ==========================================

  /**
   * Hook para validação adicional de integridade do arquivo
   * Pode ser sobrescrito por subclasses
   */
  async validateFileIntegrity(file) {
    // Implementação básica - pode ser estendida
    if (file.truncated) {
      throw new Error('Arquivo foi truncado durante o upload');
    }
  }

  /**
   * Hook executado antes do upload principal
   */
  async beforeMainProcess() {
    const uploadMetadata = this.getContextData('uploadMetadata');

    // Hook para processamento de imagem (redimensionamento, etc.)
    await this.preprocessFile(uploadMetadata);
  }

  /**
   * Hook para pré-processamento do arquivo
   * Pode ser sobrescrito para redimensionamento, compressão, etc.
   */
  async preprocessFile(metadata) {
    // Implementação padrão vazia
    // Subclasses podem implementar redimensionamento, compressão, etc.
  }

  /**
   * Hook para persistir informações do upload
   * Pode ser sobrescrito para salvar no banco de dados
   */
  async persistUploadInfo(uploadResult) {
    // Implementação padrão vazia
    // Subclasses podem implementar persistência no banco
  }

  /**
   * Hook executado em caso de erro
   */
  async onError(error) {
    this.requestLogger.error('Erro durante upload', {
      template: this.name,
      error: error.message,
      step: this.getCurrentStep(),
    });

    // Cleanup em caso de erro
    await this.cleanup();
  }

  /**
   * Limpeza de recursos em caso de erro
   */
  async cleanup() {
    // Implementação padrão vazia
    // Subclasses podem implementar limpeza de arquivos temporários
  }
}

/**
 * Template especializado para upload de imagens
 */
class ImageUploadTemplate extends UploadProcessTemplate {
  constructor(options = {}) {
    super({
      ...options,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      folder: options.folder || 'images',
    });
  }

  /**
   * Validação específica para imagens
   */
  async validateFileIntegrity(file) {
    await super.validateFileIntegrity(file);

    // Validações específicas para imagens
    const { width, height } = this.context.options;

    if (width && height) {
      // Aqui poderia validar dimensões da imagem
      // Implementação dependeria de uma biblioteca como sharp
    }
  }

  /**
   * Pré-processamento específico para imagens
   */
  async preprocessFile(metadata) {
    const { resize, quality } = this.context.options;

    if (resize || quality) {
      this.requestLogger.debug('Aplicando pré-processamento de imagem', {
        template: this.name,
        resize,
        quality,
      });

      // Aqui seria implementado redimensionamento/compressão
      // usando bibliotecas como sharp ou jimp
    }
  }
}

/**
 * Template especializado para upload de documentos
 */
class DocumentUploadTemplate extends UploadProcessTemplate {
  constructor(options = {}) {
    super({
      ...options,
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      folder: options.folder || 'documents',
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB para documentos
    });
  }

  /**
   * Validação específica para documentos
   */
  async validateFileIntegrity(file) {
    await super.validateFileIntegrity(file);

    // Validações específicas para documentos
    if (file.mimetype === 'application/pdf') {
      // Validar se é um PDF válido
      await this.validatePDF(file);
    }
  }

  /**
   * Valida se o arquivo PDF é válido
   */
  async validatePDF(file) {
    // Implementação básica - verificar header PDF
    const buffer = file.buffer;
    if (buffer && !buffer.toString('ascii', 0, 4).includes('%PDF')) {
      throw new Error('Arquivo PDF inválido');
    }
  }
}

module.exports = {
  UploadProcessTemplate,
  ImageUploadTemplate,
  DocumentUploadTemplate,
};
