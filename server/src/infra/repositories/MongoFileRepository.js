// Interface removida na limpeza
const File = require('../../domain/entities/File');
const mongoose = require('mongoose');

// Schema do File
const FileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    ownerId: { type: String, required: true },
    ownerType: { type: String, enum: ['user', 'organization'], default: 'user' },
    folder: { type: String, default: 'general' },
    isPublic: { type: Boolean, default: false },
    metadata: { type: Object, default: {} },
  },
  {
    timestamps: true,
  }
);

const FileModel = mongoose.model('File', FileSchema);

class MongoFileRepository {
  async save(file) {
    try {
      const fileData = {
        originalName: file.originalName,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        fileSize: file.fileSize,
        ownerId: file.ownerId,
        ownerType: file.ownerType,
        folder: file.folder,
        isPublic: file.isPublic,
        metadata: file.metadata,
      };

      const savedFile = await FileModel.create(fileData);
      return this._mapToEntity(savedFile);
    } catch (error) {
      throw new Error(`Error saving file: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const file = await FileModel.findById(id);
      return file ? this._mapToEntity(file) : null;
    } catch (error) {
      throw new Error(`Error finding file by id: ${error.message}`);
    }
  }

  async findByOwnerId(ownerId) {
    try {
      const files = await FileModel.find({ ownerId }).sort({ createdAt: -1 });
      return files.map((file) => this._mapToEntity(file));
    } catch (error) {
      throw new Error(`Error finding files by owner: ${error.message}`);
    }
  }

  async findByType(fileType) {
    try {
      const files = await FileModel.find({ fileType }).sort({ createdAt: -1 });
      return files.map((file) => this._mapToEntity(file));
    } catch (error) {
      throw new Error(`Error finding files by type: ${error.message}`);
    }
  }

  async findByFolder(folder) {
    try {
      const files = await FileModel.find({ folder }).sort({ createdAt: -1 });
      return files.map((file) => this._mapToEntity(file));
    } catch (error) {
      throw new Error(`Error finding files by folder: ${error.message}`);
    }
  }

  async update(id, fileData) {
    try {
      const updatedFile = await FileModel.findByIdAndUpdate(
        id,
        { ...fileData, updatedAt: new Date() },
        { new: true }
      );
      return updatedFile ? this._mapToEntity(updatedFile) : null;
    } catch (error) {
      throw new Error(`Error updating file: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const deletedFile = await FileModel.findByIdAndDelete(id);
      return deletedFile ? this._mapToEntity(deletedFile) : null;
    } catch (error) {
      throw new Error(`Error deleting file: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const files = await FileModel.find().sort({ createdAt: -1 });
      return files.map((file) => this._mapToEntity(file));
    } catch (error) {
      throw new Error(`Error finding all files: ${error.message}`);
    }
  }

  async findByDateRange(startDate, endDate) {
    try {
      const files = await FileModel.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      }).sort({ createdAt: -1 });
      return files.map((file) => this._mapToEntity(file));
    } catch (error) {
      throw new Error(`Error finding files by date range: ${error.message}`);
    }
  }

  async findPublicFiles() {
    try {
      const files = await FileModel.find({ isPublic: true }).sort({ createdAt: -1 });
      return files.map((file) => this._mapToEntity(file));
    } catch (error) {
      throw new Error(`Error finding public files: ${error.message}`);
    }
  }

  _mapToEntity(fileDoc) {
    return new File(
      fileDoc._id.toString(),
      fileDoc.originalName,
      fileDoc.fileName,
      fileDoc.fileUrl,
      fileDoc.fileType,
      fileDoc.fileSize,
      fileDoc.ownerId,
      fileDoc.ownerType,
      fileDoc.folder,
      fileDoc.isPublic,
      fileDoc.createdAt,
      fileDoc.updatedAt,
      fileDoc.metadata
    );
  }
}

module.exports = MongoFileRepository;
