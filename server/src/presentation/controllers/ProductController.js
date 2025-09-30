const WhatsAppUtils = require('../../infra/adapters/WhatsAppUtils');
// Validators removidos na limpeza - usando validação direta

class ProductController {
  constructor(productService) {
    this.productService = productService;
  }

  createProduct = async (req, res) => {
    try {
      const productData = req.body;
      const organizationId = req.user.id;

      // Validação básica direta
      if (!productData.name || !productData.price || !productData.description) {
        return res.status(400).json({
          success: false,
          message: 'Nome, preço e descrição são obrigatórios',
        });
      }

      const product = await this.productService.createProduct(productData, organizationId);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  updateProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const productData = req.body;
      const organizationId = req.user.id;

      // Validação básica direta
      if (productData.name === '' || productData.price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Dados de produto inválidos',
        });
      }

      const product = await this.productService.updateProduct(id, productData, organizationId);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = req.user.id;

      await this.productService.deleteProduct(id, organizationId);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getProduct = async (req, res) => {
    try {
      const { id } = req.params;

      const product = await this.productService.getProduct(id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  };

  getProductsByOrganization = async (req, res) => {
    try {
      const organizationId = req.user.id;

      const products = await this.productService.getProductsByOrganization(organizationId);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getAllAvailableProducts = async (req, res) => {
    try {
      const products = await this.productService.getAllAvailableProducts();

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  searchProducts = async (req, res) => {
    try {
      const { q } = req.query;

      const products = await this.productService.searchProducts(q);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  toggleProductAvailability = async (req, res) => {
    try {
      const { id } = req.params;
      const organizationId = req.user.id;

      const product = await this.productService.toggleProductAvailability(id, organizationId);

      res.status(200).json({
        success: true,
        message: `Product ${product.isAvailable ? 'activated' : 'deactivated'} successfully`,
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  updateProductStock = async (req, res) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      const organizationId = req.user.id;

      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock must be a number greater than or equal to zero',
        });
      }

      const product = await this.productService.updateProductStock(id, stock, organizationId);

      res.status(200).json({
        success: true,
        message: 'Product stock updated successfully',
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  getWhatsAppLink = async (req, res) => {
    try {
      const { id } = req.params;
      const { phone } = req.query;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
      }

      const product = await this.productService.getProduct(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      const whatsappLink = WhatsAppUtils.generateProductLink(
        phone,
        product.name,
        product.organizationName,
        product.price
      );

      res.status(200).json({
        success: true,
        data: {
          whatsappLink,
          product: {
            id: product.id,
            name: product.name,
            organizationName: product.organizationName,
            price: product.price,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
}

module.exports = ProductController;
