/**
 * Interface para repositório de produtos
 * Define contrato para persistência de produtos
 */
class IProductRepository {
  async create(productData) {
    throw new Error('create method must be implemented');
  }

  async findById(id) {
    throw new Error('findById method must be implemented');
  }

  async findAll(filters = {}) {
    throw new Error('findAll method must be implemented');
  }

  async update(id, updateData) {
    throw new Error('update method must be implemented');
  }

  async delete(id) {
    throw new Error('delete method must be implemented');
  }

  async findByOrganization(organizationId) {
    throw new Error('findByOrganization method must be implemented');
  }

  async count(filters = {}) {
    throw new Error('count method must be implemented');
  }
}

module.exports = IProductRepository;
