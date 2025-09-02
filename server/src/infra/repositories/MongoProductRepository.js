const IProductRepository = require("../../domain/repositories/IProductRepository");
const ProductModel = require("../database/models/ProductModel");
const Product = require("../../domain/entities/Product");

class MongoProductRepository extends IProductRepository {
  async save(product) {
    try {
      const productData = {
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrls: product.imageUrls,
        organizationId: product.organizationId,
        organizationName: product.organizationName,
        isAvailable: product.isAvailable,
        category: product.category,
        stock: product.stock || 1,
        createdAt: product.createdAt || new Date(), // Explicitly set
        updatedAt: product.updatedAt || new Date(), // Explicitly set
      };

      const savedProduct = await ProductModel.create(productData);
      return this._mapToEntity(savedProduct);
    } catch (error) {
      throw new Error(`Error saving product: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const product = await ProductModel.findById(id);
      return product ? this._mapToEntity(product) : null;
    } catch (error) {
      throw new Error(`Error finding product by id: ${error.message}`);
    }
  }

  async findByOrganizationId(organizationId) {
    try {
      const products = await ProductModel.find({ organizationId });
      return products.map((product) => this._mapToEntity(product));
    } catch (error) {
      throw new Error(
        `Error finding products by organization: ${error.message}`
      );
    }
  }

  async findAvailable() {
    try {
      const products = await ProductModel.find({ isAvailable: true });
      return products.map((product) => this._mapToEntity(product));
    } catch (error) {
      throw new Error(`Error finding available products: ${error.message}`);
    }
  }

  async update(id, productData) {
    try {
      const updatedProduct = await ProductModel.findByIdAndUpdate(
        id,
        { ...productData, updatedAt: new Date() },
        { new: true }
      );
      return updatedProduct ? this._mapToEntity(updatedProduct) : null;
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const deletedProduct = await ProductModel.findByIdAndDelete(id);
      return deletedProduct ? this._mapToEntity(deletedProduct) : null;
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const products = await ProductModel.find();
      return products.map((product) => this._mapToEntity(product));
    } catch (error) {
      throw new Error(`Error finding all products: ${error.message}`);
    }
  }

  async searchByName(name) {
    try {
      const products = await ProductModel.find({
        $text: { $search: name },
        isAvailable: true,
      });
      return products.map((product) => this._mapToEntity(product));
    } catch (error) {
      throw new Error(`Error searching products: ${error.message}`);
    }
  }

  _mapToEntity(productDoc) {
    return new Product(
      productDoc._id.toString(),
      productDoc.name,
      productDoc.description,
      productDoc.price,
      productDoc.imageUrls,
      productDoc.organizationId.toString(),
      productDoc.organizationName,
      productDoc.isAvailable,
      productDoc.createdAt,
      productDoc.updatedAt,
      productDoc.category,
      productDoc.stock || 1
    );
  }
}

module.exports = MongoProductRepository;
