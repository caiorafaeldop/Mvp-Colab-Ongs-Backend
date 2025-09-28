class IProductService {
  async createProduct(productData, organizationId) {
    throw new Error("Method createProduct() must be implemented");
  }

  async updateProduct(id, productData, organizationId) {
    throw new Error("Method updateProduct() must be implemented");
  }

  async deleteProduct(id, organizationId) {
    throw new Error("Method deleteProduct() must be implemented");
  }

  async getProduct(id) {
    throw new Error("Method getProduct() must be implemented");
  }

  async getProductsByOrganization(organizationId) {
    throw new Error("Method getProductsByOrganization() must be implemented");
  }

  async getAllAvailableProducts() {
    throw new Error("Method getAllAvailableProducts() must be implemented");
  }

  async searchProducts(query) {
    throw new Error("Method searchProducts() must be implemented");
  }

  async toggleProductAvailability(id, organizationId) {
    throw new Error("Method toggleProductAvailability() must be implemented");
  }
}

module.exports = IProductService;

