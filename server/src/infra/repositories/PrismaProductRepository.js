// Interface removida na limpeza
const Product = require("../../domain/entities/Product");
const PrismaService = require("../singletons/PrismaService");

/**
 * Implementação Prisma do Repository Pattern para Produtos
 * Segue os princípios SOLID e Clean Architecture
 * Mantém compatibilidade com a interface existente
 */
class PrismaProductRepository  {
  constructor() {
    // super() removido na limpeza
    this.prismaService = PrismaService.getInstance();
  }

  /**
   * Obtém o cliente Prisma inicializado
   * @returns {PrismaClient} Cliente Prisma
   * @private
   */
  _getPrismaClient() {
    if (!this.prismaService.isReady()) {
      throw new Error('PrismaService não está inicializado. Chame initialize() primeiro.');
    }
    return this.prismaService.getClient();
  }

  /**
   * Converte dados do Prisma para entidade de domínio
   * @param {Object} productData - Dados do produto do Prisma
   * @returns {Product} Entidade de produto do domínio
   * @private
   */
  _mapToEntity(productData) {
    return new Product(
      productData.id,
      productData.name,
      productData.description,
      productData.price,
      productData.imageUrls,
      productData.organizationId,
      productData.organizationName,
      productData.isAvailable,
      productData.createdAt,
      productData.updatedAt,
      productData.category,
      productData.stock || 1
    );
  }

  /**
   * Converte entidade de domínio para dados do Prisma
   * @param {Product} product - Entidade de produto
   * @returns {Object} Dados para o Prisma
   * @private
   */
  _mapToPrismaData(product) {
    const data = {
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrls: product.imageUrls || [],
      organizationId: product.organizationId,
      organizationName: product.organizationName,
      isAvailable: product.isAvailable !== false, // default true
      category: product.category,
      stock: product.stock || 1,
    };

    // Remove campos undefined
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });

    return data;
  }

  /**
   * Salva um produto no banco de dados
   * @param {Product} product - Entidade de produto do domínio
   * @returns {Promise<Product>} Produto salvo como entidade de domínio
   */
  async save(product) {
    try {
      console.log("[PRISMA PRODUCT REPO] Salvando produto:", { name: product.name, organizationId: product.organizationId });
      
      const prisma = this._getPrismaClient();
      const productData = this._mapToPrismaData(product);

      const savedProduct = await prisma.product.create({
        data: productData,
      });

      console.log("[PRISMA PRODUCT REPO] Produto salvo com sucesso:", savedProduct.id);
      return this._mapToEntity(savedProduct);
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro ao salvar produto:", error.message);
      throw new Error(`Error saving product: ${error.message}`);
    }
  }

  /**
   * Busca produto por ID
   * @param {string} id - ID do produto
   * @returns {Promise<Product|null>} Entidade de produto ou null
   */
  async findById(id) {
    try {
      console.log("[PRISMA PRODUCT REPO] Buscando produto por ID:", id);
      
      const prisma = this._getPrismaClient();
      const product = await prisma.product.findUnique({
        where: { id },
      });

      console.log("[PRISMA PRODUCT REPO] Produto encontrado:", !!product);
      return product ? this._mapToEntity(product) : null;
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro ao buscar produto por ID:", error.message);
      throw new Error(`Error finding product by id: ${error.message}`);
    }
  }

  /**
   * Busca produtos por ID da organização
   * @param {string} organizationId - ID da organização
   * @returns {Promise<Product[]>} Lista de produtos
   */
  async findByOrganizationId(organizationId) {
    try {
      console.log("[PRISMA PRODUCT REPO] Buscando produtos por organização:", organizationId);
      
      const prisma = this._getPrismaClient();
      const products = await prisma.product.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });

      console.log("[PRISMA PRODUCT REPO] Produtos encontrados por organização:", products.length);
      return products.map(product => this._mapToEntity(product));
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro ao buscar produtos por organização:", error.message);
      throw new Error(`Error finding products by organization: ${error.message}`);
    }
  }

  /**
   * Busca produtos disponíveis
   * @returns {Promise<Product[]>} Lista de produtos disponíveis
   */
  async findAvailable() {
    try {
      console.log("[PRISMA PRODUCT REPO] Buscando produtos disponíveis");
      
      const prisma = this._getPrismaClient();
      const products = await prisma.product.findMany({
        where: { isAvailable: true },
        orderBy: { createdAt: 'desc' },
      });

      console.log("[PRISMA PRODUCT REPO] Produtos disponíveis encontrados:", products.length);
      return products.map(product => this._mapToEntity(product));
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro ao buscar produtos disponíveis:", error.message);
      throw new Error(`Error finding available products: ${error.message}`);
    }
  }

  /**
   * Atualiza um produto
   * @param {string} id - ID do produto
   * @param {Object} productData - Dados para atualização
   * @returns {Promise<Product|null>} Produto atualizado ou null
   */
  async update(id, productData) {
    try {
      console.log("[PRISMA PRODUCT REPO] Atualizando produto:", id);
      
      const prisma = this._getPrismaClient();
      
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          ...productData,
          updatedAt: new Date(),
        },
      });

      console.log("[PRISMA PRODUCT REPO] Produto atualizado com sucesso:", updatedProduct.id);
      return this._mapToEntity(updatedProduct);
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro ao atualizar produto:", error.message);
      
      if (error.code === 'P2025') {
        console.log("[PRISMA PRODUCT REPO] Produto não encontrado para atualização:", id);
        return null;
      }
      
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  /**
   * Remove um produto
   * @param {string} id - ID do produto
   * @returns {Promise<Product|null>} Produto removido ou null
   */
  async delete(id) {
    try {
      console.log("[PRISMA PRODUCT REPO] Removendo produto:", id);
      
      const prisma = this._getPrismaClient();
      const deletedProduct = await prisma.product.delete({
        where: { id },
      });

      console.log("[PRISMA PRODUCT REPO] Produto removido com sucesso:", deletedProduct.id);
      return this._mapToEntity(deletedProduct);
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro ao remover produto:", error.message);
      
      if (error.code === 'P2025') {
        console.log("[PRISMA PRODUCT REPO] Produto não encontrado para remoção:", id);
        return null;
      }
      
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }

  /**
   * Busca todos os produtos
   * @returns {Promise<Product[]>} Lista de todos os produtos
   */
  async findAll() {
    try {
      console.log("[PRISMA PRODUCT REPO] Buscando todos os produtos");
      
      const prisma = this._getPrismaClient();
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      });

      console.log("[PRISMA PRODUCT REPO] Total de produtos encontrados:", products.length);
      return products.map(product => this._mapToEntity(product));
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro ao buscar todos os produtos:", error.message);
      throw new Error(`Error finding all products: ${error.message}`);
    }
  }

  /**
   * Busca produtos por nome (busca textual)
   * @param {string} name - Nome ou termo de busca
   * @returns {Promise<Product[]>} Lista de produtos encontrados
   */
  async searchByName(name) {
    try {
      console.log("[PRISMA PRODUCT REPO] Buscando produtos por nome:", name);
      
      const prisma = this._getPrismaClient();
      
      // No MongoDB com Prisma, usamos contains para busca textual
      const products = await prisma.product.findMany({
        where: {
          AND: [
            { isAvailable: true },
            {
              OR: [
                { name: { contains: name, mode: 'insensitive' } },
                { description: { contains: name, mode: 'insensitive' } },
                { category: { contains: name, mode: 'insensitive' } },
              ],
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log("[PRISMA PRODUCT REPO] Produtos encontrados na busca:", products.length);
      return products.map(product => this._mapToEntity(product));
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro na busca de produtos:", error.message);
      throw new Error(`Error searching products: ${error.message}`);
    }
  }

  /**
   * Busca produtos por categoria
   * @param {string} category - Categoria do produto
   * @returns {Promise<Product[]>} Lista de produtos da categoria
   */
  async findByCategory(category) {
    try {
      console.log("[PRISMA PRODUCT REPO] Buscando produtos por categoria:", category);
      
      const prisma = this._getPrismaClient();
      const products = await prisma.product.findMany({
        where: {
          category: { contains: category, mode: 'insensitive' },
          isAvailable: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log("[PRISMA PRODUCT REPO] Produtos encontrados por categoria:", products.length);
      return products.map(product => this._mapToEntity(product));
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro ao buscar produtos por categoria:", error.message);
      throw new Error(`Error finding products by category: ${error.message}`);
    }
  }

  /**
   * Conta produtos por organização
   * @param {string} organizationId - ID da organização
   * @returns {Promise<number>} Número de produtos
   */
  async countByOrganization(organizationId) {
    try {
      console.log("[PRISMA PRODUCT REPO] Contando produtos por organização:", organizationId);
      
      const prisma = this._getPrismaClient();
      const count = await prisma.product.count({
        where: { organizationId },
      });

      console.log("[PRISMA PRODUCT REPO] Total de produtos da organização:", count);
      return count;
    } catch (error) {
      console.error("[PRISMA PRODUCT REPO] Erro ao contar produtos por organização:", error.message);
      throw new Error(`Error counting products by organization: ${error.message}`);
    }
  }
}

module.exports = PrismaProductRepository;
