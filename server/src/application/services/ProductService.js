const Product = require('../../domain/entities/Product');
const { getInstance: getEventManager } = require('../../infra/events/EventManager');

class ProductService {
  constructor(productRepository, userRepository) {
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.eventManager = getEventManager();
  }

  async createProduct(productData, organizationId) {
    try {
      // Verify if user is an organization
      const organization = await this.userRepository.findById(organizationId);
      if (!organization || organization.userType !== 'organization') {
        throw new Error('Only organizations can create products');
      }

      // Validate product data
      this._validateProductData(productData);

      // Create product
      const product = Product.create(
        productData.name,
        productData.description,
        productData.price,
        productData.imageUrls,
        organizationId,
        organization.name,
        productData.category,
        productData.stock || 1
      );

      // Save product
      const savedProduct = await this.productRepository.save(product);

      // Emit event
      await this.eventManager.emit(
        'product.created',
        {
          productId: savedProduct.id,
          productName: savedProduct.name,
          organizationId: savedProduct.organizationId,
          organizationName: savedProduct.organizationName,
          price: savedProduct.price,
          category: savedProduct.category,
        },
        { source: 'ProductService' }
      );

      return {
        id: savedProduct.id,
        name: savedProduct.name,
        description: savedProduct.description,
        price: savedProduct.price,
        imageUrls: savedProduct.imageUrls,
        organizationId: savedProduct.organizationId,
        organizationName: savedProduct.organizationName,
        isAvailable: savedProduct.isAvailable,
        createdAt: savedProduct.createdAt,
        category: savedProduct.category,
        stock: savedProduct.stock,
      };
    } catch (error) {
      throw new Error(`Error creating product: ${error.message}`);
    }
  }

  async updateProduct(id, productData, organizationId, userType = null) {
    try {
      // Verify if product exists and belongs to organization
      const existingProduct = await this.productRepository.findById(id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // REGRA: Contas 'organization' podem editar QUALQUER produto
      if (userType !== 'organization' && existingProduct.organizationId !== organizationId) {
        throw new Error('You can only update your own products');
      }

      // Validate product data
      this._validateProductData(productData);

      // Update product
      const updatedProduct = await this.productRepository.update(id, {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        imageUrls: productData.imageUrls,
        category: productData.category,
        stock: productData.stock !== undefined ? productData.stock : existingProduct.stock,
      });

      // Emit event
      await this.eventManager.emit(
        'product.updated',
        {
          productId: updatedProduct.id,
          changes: {
            name: productData.name !== existingProduct.name,
            price: productData.price !== existingProduct.price,
            stock: productData.stock !== existingProduct.stock,
          },
        },
        { source: 'ProductService' }
      );

      return {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        imageUrls: updatedProduct.imageUrls,
        organizationId: updatedProduct.organizationId,
        organizationName: updatedProduct.organizationName,
        isAvailable: updatedProduct.isAvailable,
        updatedAt: updatedProduct.updatedAt,
        category: updatedProduct.category,
        stock: updatedProduct.stock,
      };
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  async deleteProduct(id, organizationId, userType = null) {
    try {
      // Verify if product exists and belongs to organization
      const existingProduct = await this.productRepository.findById(id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // REGRA: Contas 'organization' podem deletar QUALQUER produto
      if (userType !== 'organization' && existingProduct.organizationId !== organizationId) {
        throw new Error('You can only delete your own products');
      }

      await this.productRepository.delete(id);

      // Emit event
      await this.eventManager.emit(
        'product.deleted',
        {
          productId: id,
          organizationId: existingProduct.organizationId,
        },
        { source: 'ProductService' }
      );

      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }

  async getProduct(id) {
    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrls: product.imageUrls,
        organizationId: product.organizationId,
        organizationName: product.organizationName,
        isAvailable: product.isAvailable,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category: product.category,
        stock: product.stock,
      };
    } catch (error) {
      throw new Error(`Error getting product: ${error.message}`);
    }
  }

  async getProductsByOrganization(organizationId) {
    try {
      const products = await this.productRepository.findByOrganizationId(organizationId);

      return products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrls: product.imageUrls,
        organizationId: product.organizationId,
        organizationName: product.organizationName,
        isAvailable: product.isAvailable,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category: product.category,
        stock: product.stock,
      }));
    } catch (error) {
      throw new Error(`Error getting organization products: ${error.message}`);
    }
  }

  async getAllAvailableProducts() {
    try {
      const products = await this.productRepository.findAvailable();

      return products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrls: product.imageUrls,
        organizationId: product.organizationId,
        organizationName: product.organizationName,
        isAvailable: product.isAvailable,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category: product.category,
        stock: product.stock,
      }));
    } catch (error) {
      throw new Error(`Error getting available products: ${error.message}`);
    }
  }

  async searchProducts(query) {
    try {
      if (!query || query.trim().length === 0) {
        return await this.getAllAvailableProducts();
      }

      const products = await this.productRepository.searchByName(query.trim());

      return products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrls: product.imageUrls,
        organizationId: product.organizationId,
        organizationName: product.organizationName,
        isAvailable: product.isAvailable,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category: product.category,
        stock: product.stock,
      }));
    } catch (error) {
      throw new Error(`Error searching products: ${error.message}`);
    }
  }

  async toggleProductAvailability(id, organizationId, userType = null) {
    try {
      // Verify if product exists and belongs to organization
      const existingProduct = await this.productRepository.findById(id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // REGRA: Contas 'organization' podem editar QUALQUER produto
      if (userType !== 'organization' && existingProduct.organizationId !== organizationId) {
        throw new Error('You can only update your own products');
      }

      // Toggle availability
      existingProduct.toggleAvailability();
      const updatedProduct = await this.productRepository.update(id, {
        isAvailable: existingProduct.isAvailable,
      });

      // Emit event
      await this.eventManager.emit(
        'product.availability.changed',
        {
          productId: updatedProduct.id,
          isAvailable: updatedProduct.isAvailable,
        },
        { source: 'ProductService' }
      );

      return {
        id: updatedProduct.id,
        name: updatedProduct.name,
        isAvailable: updatedProduct.isAvailable,
        updatedAt: updatedProduct.updatedAt,
        category: updatedProduct.category,
        stock: updatedProduct.stock,
      };
    } catch (error) {
      throw new Error(`Error toggling product availability: ${error.message}`);
    }
  }

  async updateProductStock(id, stock, organizationId, userType = null) {
    try {
      // Verify if product exists and belongs to organization
      const existingProduct = await this.productRepository.findById(id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // REGRA: Contas 'organization' podem editar QUALQUER produto
      if (userType !== 'organization' && existingProduct.organizationId !== organizationId) {
        throw new Error('You can only update your own products');
      }

      // Validate stock
      if (typeof stock !== 'number' || stock < 0) {
        throw new Error('Stock must be a number greater than or equal to zero');
      }

      // Update stock
      const updatedProduct = await this.productRepository.update(id, {
        stock: stock,
      });

      // Emit low stock event if needed
      if (stock < 5 && stock > 0) {
        await this.eventManager.emit(
          'product.stock.low',
          {
            productId: updatedProduct.id,
            productName: updatedProduct.name,
            currentStock: stock,
            threshold: 5,
          },
          { source: 'ProductService' }
        );
      }

      return {
        id: updatedProduct.id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        updatedAt: updatedProduct.updatedAt,
      };
    } catch (error) {
      throw new Error(`Error updating product stock: ${error.message}`);
    }
  }

  _validateProductData(productData) {
    if (!productData.name || productData.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (!productData.description || productData.description.trim().length === 0) {
      throw new Error('Product description is required');
    }

    if (!productData.price || productData.price <= 0) {
      throw new Error('Product price must be greater than zero');
    }

    if (
      !productData.imageUrls ||
      !Array.isArray(productData.imageUrls) ||
      productData.imageUrls.length === 0 ||
      !productData.imageUrls.every((url) => url.trim().length > 0)
    ) {
      throw new Error('At least one non-empty product image URL is required');
    }
  }
}

module.exports = ProductService;
