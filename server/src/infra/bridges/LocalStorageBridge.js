const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const IStorageBridge = require('../../domain/bridges/IStorageBridge');

/**
 * Bridge para Local Storage
 * Implementação para armazenamento local no sistema de arquivos
 */
class LocalStorageBridge extends IStorageBridge {
  constructor(basePath = './uploads') {
    super();
    this.basePath = path.resolve(basePath);
    this.providerName = 'Local';
    this.ensureDirectoryExists();
  }

  /**
   * Garante que o diretório base existe
   */
  ensureDirectoryExists() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      console.log(`[LocalStorageBridge] Diretório criado: ${this.basePath}`);
    }
  }

  /**
   * Faz upload de arquivo
   * @param {File} file - Arquivo a ser enviado
   * @param {Object} options - Opções do upload
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadFile(file, options = {}) {
    try {
      console.log(`[LocalStorageBridge] Iniciando upload: ${file.originalname}`);

      const fileId = this.generateFileId(file.originalname);
      const folder = options.folder || 'general';
      const folderPath = path.join(this.basePath, folder);
      
      // Cria pasta se não existir
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, fileId);
      
      // Salva arquivo
      fs.writeFileSync(filePath, file.buffer);

      const stats = fs.statSync(filePath);
      const url = `/uploads/${folder}/${fileId}`;

      console.log(`[LocalStorageBridge] Upload concluído: ${url}`);

      return {
        success: true,
        fileId: fileId,
        url: url,
        originalName: file.originalname,
        size: stats.size,
        format: path.extname(file.originalname).slice(1),
        provider: this.providerName,
        metadata: {
          path: filePath,
          folder: folder,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        }
      };

    } catch (error) {
      console.error('[LocalStorageBridge] Erro no upload:', error.message);
      throw new Error(`Local upload failed: ${error.message}`);
    }
  }

  /**
   * Remove arquivo
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<Object>} Resultado da remoção
   */
  async deleteFile(fileId) {
    try {
      console.log(`[LocalStorageBridge] Removendo arquivo: ${fileId}`);

      const filePath = this.findFilePath(fileId);
      
      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('Arquivo não encontrado');
      }

      fs.unlinkSync(filePath);

      console.log(`[LocalStorageBridge] Arquivo removido: ${fileId}`);

      return {
        success: true,
        fileId: fileId,
        provider: this.providerName
      };

    } catch (error) {
      console.error('[LocalStorageBridge] Erro na remoção:', error.message);
      throw new Error(`Local delete failed: ${error.message}`);
    }
  }

  /**
   * Obtém URL do arquivo
   * @param {string} fileId - ID do arquivo
   * @param {Object} options - Opções (não aplicáveis para local)
   * @returns {Promise<string>} URL do arquivo
   */
  async getFileUrl(fileId, options = {}) {
    try {
      const filePath = this.findFilePath(fileId);
      
      if (!filePath) {
        throw new Error('Arquivo não encontrado');
      }

      // Para storage local, retorna caminho relativo
      const relativePath = path.relative(this.basePath, filePath);
      return `/uploads/${relativePath.replace(/\\/g, '/')}`;

    } catch (error) {
      console.error('[LocalStorageBridge] Erro ao gerar URL:', error.message);
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
      console.log('[LocalStorageBridge] Listando arquivos...');

      const files = [];
      const searchPath = filters.folder ? 
        path.join(this.basePath, filters.folder) : 
        this.basePath;

      if (!fs.existsSync(searchPath)) {
        return files;
      }

      const scanDirectory = (dirPath, relativePath = '') => {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);

          if (stats.isFile()) {
            const fileInfo = this.getFileInfo(itemPath, relativePath);
            
            // Aplica filtros
            if (this.matchesFilters(fileInfo, filters)) {
              files.push(fileInfo);
            }
          } else if (stats.isDirectory() && !filters.folder) {
            // Recursivo apenas se não especificou pasta
            scanDirectory(itemPath, path.join(relativePath, item));
          }
        }
      };

      scanDirectory(searchPath);

      // Limita resultados
      const limit = filters.limit || 50;
      const limitedFiles = files.slice(0, limit);

      console.log(`[LocalStorageBridge] ${limitedFiles.length} arquivos encontrados`);

      return limitedFiles;

    } catch (error) {
      console.error('[LocalStorageBridge] Erro ao listar arquivos:', error.message);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Obtém informações de um arquivo
   * @param {string} filePath - Caminho do arquivo
   * @param {string} relativePath - Caminho relativo
   * @returns {Object} Informações do arquivo
   */
  getFileInfo(filePath, relativePath) {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).slice(1);
    const folder = relativePath || path.dirname(path.relative(this.basePath, filePath));

    return {
      fileId: fileName,
      url: `/uploads/${path.join(folder, fileName).replace(/\\/g, '/')}`,
      originalName: fileName,
      format: ext,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      provider: this.providerName,
      metadata: {
        path: filePath,
        folder: folder === '.' ? '' : folder
      }
    };
  }

  /**
   * Verifica se arquivo corresponde aos filtros
   * @param {Object} fileInfo - Informações do arquivo
   * @param {Object} filters - Filtros
   * @returns {boolean} True se corresponde
   */
  matchesFilters(fileInfo, filters) {
    if (filters.format && fileInfo.format !== filters.format) {
      return false;
    }

    if (filters.minSize && fileInfo.size < filters.minSize) {
      return false;
    }

    if (filters.maxSize && fileInfo.size > filters.maxSize) {
      return false;
    }

    if (filters.createdAfter && fileInfo.createdAt < new Date(filters.createdAfter)) {
      return false;
    }

    return true;
  }

  /**
   * Gera ID único para arquivo
   * @param {string} originalName - Nome original
   * @returns {string} ID único
   */
  generateFileId(originalName) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    return `${baseName}-${timestamp}-${random}${ext}`;
  }

  /**
   * Encontra caminho do arquivo pelo ID
   * @param {string} fileId - ID do arquivo
   * @returns {string|null} Caminho do arquivo
   */
  findFilePath(fileId) {
    const searchInDirectory = (dirPath) => {
      if (!fs.existsSync(dirPath)) return null;

      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isFile() && item === fileId) {
          return itemPath;
        } else if (stats.isDirectory()) {
          const found = searchInDirectory(itemPath);
          if (found) return found;
        }
      }

      return null;
    };

    return searchInDirectory(this.basePath);
  }

  /**
   * Obtém informações do provedor
   * @returns {Object} Informações do provedor
   */
  getProviderInfo() {
    return {
      name: this.providerName,
      type: 'local',
      features: [
        'file_storage',
        'folder_organization',
        'direct_access'
      ],
      supportedFormats: ['*'],
      maxFileSize: 'Unlimited (disk space)',
      transformations: false,
      cdn: false,
      basePath: this.basePath
    };
  }

  /**
   * Obtém estatísticas de uso
   * @returns {Promise<Object>} Estatísticas
   */
  async getUsageStats() {
    try {
      let totalFiles = 0;
      let totalSize = 0;

      const scanDirectory = (dirPath) => {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);

          if (stats.isFile()) {
            totalFiles++;
            totalSize += stats.size;
          } else if (stats.isDirectory()) {
            scanDirectory(itemPath);
          }
        }
      };

      scanDirectory(this.basePath);

      return {
        provider: this.providerName,
        totalFiles,
        totalStorage: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
        basePath: this.basePath,
        diskSpace: this.getDiskSpace()
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Obtém informações de espaço em disco
   * @returns {Object} Informações de espaço
   */
  getDiskSpace() {
    try {
      const stats = fs.statSync(this.basePath);
      return {
        available: 'N/A - Requires system call',
        used: 'N/A - Requires system call'
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = LocalStorageBridge;
