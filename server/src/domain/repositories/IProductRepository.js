class IProductRepository {
  async save(product) {
    throw new Error("Method save() must be implemented");
  }

  async findById(id) {
    throw new Error("Method findById() must be implemented");
  }

  async findByOrganizationId(organizationId) {
    throw new Error("Method findByOrganizationId() must be implemented");
  }

  async findAvailable() {
    throw new Error("Method findAvailable() must be implemented");
  }

  async update(id, productData) {
    throw new Error("Method update() must be implemented");
  }

  async delete(id) {
    throw new Error("Method delete() must be implemented");
  }

  async findAll() {
    throw new Error("Method findAll() must be implemented");
  }

  async searchByName(name) {
    throw new Error("Method searchByName() must be implemented");
  }
}

module.exports = IProductRepository;

