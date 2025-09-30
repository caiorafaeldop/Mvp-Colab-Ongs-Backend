class File {
  constructor(
    id,
    originalName,
    fileName,
    fileUrl,
    fileType,
    fileSize,
    ownerId,
    ownerType = 'user', // user, organization
    folder = 'general',
    isPublic = false,
    uploadedAt = new Date(),
    updatedAt = new Date(),
    metadata = {}
  ) {
    this.id = id;
    this.originalName = originalName;
    this.fileName = fileName;
    this.fileUrl = fileUrl;
    this.fileType = fileType;
    this.fileSize = fileSize;
    this.ownerId = ownerId;
    this.ownerType = ownerType;
    this.folder = folder;
    this.isPublic = isPublic;
    this.uploadedAt = uploadedAt;
    this.updatedAt = updatedAt;
    this.metadata = metadata;
  }

  static create(originalName, fileName, fileUrl, fileType, fileSize, ownerId, ownerType = 'user') {
    return new File(null, originalName, fileName, fileUrl, fileType, fileSize, ownerId, ownerType);
  }

  makePublic() {
    this.isPublic = true;
    this.updatedAt = new Date();
  }

  makePrivate() {
    this.isPublic = false;
    this.updatedAt = new Date();
  }

  updateMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  isImage() {
    return this.fileType.startsWith('image/');
  }

  isDocument() {
    const docTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return docTypes.includes(this.fileType);
  }

  getFormattedSize() {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.fileSize === 0) {
      return '0 Bytes';
    }
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return Math.round((this.fileSize / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = File;
