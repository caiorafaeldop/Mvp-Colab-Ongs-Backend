class IFileRepository {
  async save(file) {
    throw new Error("Method save() must be implemented");
  }

  async findById(id) {
    throw new Error("Method findById() must be implemented");
  }

  async findByOwnerId(ownerId) {
    throw new Error("Method findByOwnerId() must be implemented");
  }

  async findByType(fileType) {
    throw new Error("Method findByType() must be implemented");
  }

  async findByFolder(folder) {
    throw new Error("Method findByFolder() must be implemented");
  }

  async update(id, fileData) {
    throw new Error("Method update() must be implemented");
  }

  async delete(id) {
    throw new Error("Method delete() must be implemented");
  }

  async findAll() {
    throw new Error("Method findAll() must be implemented");
  }

  async findByDateRange(startDate, endDate) {
    throw new Error("Method findByDateRange() must be implemented");
  }

  async findPublicFiles() {
    throw new Error("Method findPublicFiles() must be implemented");
  }
}

module.exports = IFileRepository;
