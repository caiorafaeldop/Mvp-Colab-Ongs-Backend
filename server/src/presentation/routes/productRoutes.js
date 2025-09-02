const express = require("express");
const ProductController = require("../controllers/ProductController");
const {
  authMiddleware,
  organizationMiddleware,
} = require("../middleware/AuthMiddleware");

const createProductRoutes = (productService, authService) => {
  const router = express.Router();
  const productController = new ProductController(productService);

  // Public routes
  router.get("/products", productController.getAllAvailableProducts);
  router.get("/products/search", productController.searchProducts);
  router.get("/products/:id", productController.getProduct);
  router.get("/products/:id/whatsapp", productController.getWhatsAppLink);

  // Protected routes (authentication required)
  const auth = authMiddleware(authService);
  const organization = organizationMiddleware();

  // Organization-only routes
  router.post("/products", auth, organization, productController.createProduct);
  router.put(
    "/products/:id",
    auth,
    organization,
    productController.updateProduct
  );
  router.delete(
    "/products/:id",
    auth,
    organization,
    productController.deleteProduct
  );
  router.patch(
    "/products/:id/toggle",
    auth,
    organization,
    productController.toggleProductAvailability
  );
  router.patch(
    "/products/:id/stock",
    auth,
    organization,
    productController.updateProductStock
  );
  router.get(
    "/my-products",
    auth,
    organization,
    productController.getProductsByOrganization
  );

  return router;
};

module.exports = createProductRoutes;
