const IUserRepository = require("../../domain/repositories/IUserRepository");
const User = require("../../domain/entities/User");
const PrismaService = require("../singletons/PrismaService");

/**
 * Implementação Prisma do Repository Pattern para Usuários
 * Segue os princípios SOLID e Clean Architecture
 * Mantém compatibilidade com a interface existente
 */
class PrismaUserRepository extends IUserRepository {
  constructor() {
    super();
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
   * @param {Object} userData - Dados do usuário do Prisma
   * @returns {User} Entidade de usuário do domínio
   * @private
   */
  _mapToEntity(userData) {
    return new User(
      userData.id,
      userData.name,
      userData.email,
      userData.password,
      userData.userType,
      userData.phone,
      userData.createdAt,
      userData.updatedAt
    );
  }

  /**
   * Converte entidade de domínio para dados do Prisma
   * @param {User} user - Entidade de usuário
   * @returns {Object} Dados para o Prisma
   * @private
   */
  _mapToPrismaData(user) {
    const data = {
      name: user.name,
      email: user.email.toLowerCase(),
      password: user.password,
      userType: user.userType,
      phone: user.phone,
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
   * Salva um usuário no banco de dados
   * @param {User} user - Entidade de usuário do domínio
   * @returns {Promise<User>} Usuário salvo como entidade de domínio
   */
  async save(user) {
    try {
      console.log("[PRISMA USER REPO] Salvando usuário:", { email: user.email, userType: user.userType });
      
      const prisma = this._getPrismaClient();
      const userData = this._mapToPrismaData(user);

      const savedUser = await prisma.user.create({
        data: userData,
      });

      console.log("[PRISMA USER REPO] Usuário salvo com sucesso:", savedUser.id);
      return this._mapToEntity(savedUser);
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro ao salvar usuário:", error.message);
      
      // Tratamento específico para erros do Prisma
      if (error.code === 'P2002') {
        throw new Error(`Email já está em uso: ${user.email}`);
      }
      
      throw new Error(`Error saving user: ${error.message}`);
    }
  }

  /**
   * Busca usuário por ID retornando entidade de domínio
   * @param {string} id - ID do usuário
   * @returns {Promise<User|null>} Entidade de usuário ou null
   */
  async findById(id) {
    try {
      console.log("[PRISMA USER REPO] Buscando usuário por ID:", id);
      
      const prisma = this._getPrismaClient();
      const user = await prisma.user.findUnique({
        where: { id },
      });

      console.log("[PRISMA USER REPO] Usuário encontrado:", !!user);
      return user ? this._mapToEntity(user) : null;
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro ao buscar usuário por ID:", error.message);
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  /**
   * Busca usuário por email retornando entidade de domínio
   * @param {string} email - Email do usuário
   * @returns {Promise<User|null>} Entidade de usuário ou null
   */
  async findByEmail(email) {
    try {
      console.log("[PRISMA USER REPO] Buscando usuário por email:", email);
      
      const prisma = this._getPrismaClient();
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      console.log("[PRISMA USER REPO] Usuário encontrado por email:", !!user);
      return user ? this._mapToEntity(user) : null;
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro ao buscar usuário por email:", error.message);
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  /**
   * Busca usuários por tipo
   * @param {string} userType - Tipo do usuário (organization, common)
   * @returns {Promise<User[]>} Lista de usuários
   */
  async findByUserType(userType) {
    try {
      console.log("[PRISMA USER REPO] Buscando usuários por tipo:", userType);
      
      const prisma = this._getPrismaClient();
      const users = await prisma.user.findMany({
        where: { userType },
        orderBy: { createdAt: 'desc' },
      });

      console.log("[PRISMA USER REPO] Usuários encontrados por tipo:", users.length);
      return users.map(user => this._mapToEntity(user));
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro ao buscar usuários por tipo:", error.message);
      throw new Error(`Error finding users by type: ${error.message}`);
    }
  }

  /**
   * Atualiza um usuário
   * @param {string} id - ID do usuário
   * @param {Object} userData - Dados para atualização
   * @returns {Promise<User|null>} Usuário atualizado ou null
   */
  async update(id, userData) {
    try {
      console.log("[PRISMA USER REPO] Atualizando usuário:", id);
      
      const prisma = this._getPrismaClient();
      
      // Normalizar email se fornecido
      if (userData.email) {
        userData.email = userData.email.toLowerCase();
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: userData,
      });

      console.log("[PRISMA USER REPO] Usuário atualizado com sucesso:", updatedUser.id);
      return this._mapToEntity(updatedUser);
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro ao atualizar usuário:", error.message);
      
      if (error.code === 'P2025') {
        console.log("[PRISMA USER REPO] Usuário não encontrado para atualização:", id);
        return null;
      }
      
      if (error.code === 'P2002') {
        throw new Error(`Email já está em uso: ${userData.email}`);
      }
      
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  /**
   * Remove um usuário
   * @param {string} id - ID do usuário
   * @returns {Promise<User|null>} Usuário removido ou null
   */
  async delete(id) {
    try {
      console.log("[PRISMA USER REPO] Removendo usuário:", id);
      
      const prisma = this._getPrismaClient();
      const deletedUser = await prisma.user.delete({
        where: { id },
      });

      console.log("[PRISMA USER REPO] Usuário removido com sucesso:", deletedUser.id);
      return this._mapToEntity(deletedUser);
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro ao remover usuário:", error.message);
      
      if (error.code === 'P2025') {
        console.log("[PRISMA USER REPO] Usuário não encontrado para remoção:", id);
        return null;
      }
      
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  /**
   * Busca todos os usuários
   * @returns {Promise<User[]>} Lista de todos os usuários
   */
  async findAll() {
    try {
      console.log("[PRISMA USER REPO] Buscando todos os usuários");
      
      const prisma = this._getPrismaClient();
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });

      console.log("[PRISMA USER REPO] Total de usuários encontrados:", users.length);
      return users.map(user => this._mapToEntity(user));
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro ao buscar todos os usuários:", error.message);
      throw new Error(`Error finding all users: ${error.message}`);
    }
  }

  /**
   * Verifica se um usuário existe por email
   * @param {string} email - Email do usuário
   * @returns {Promise<boolean>} True se existe, false caso contrário
   */
  async existsByEmail(email) {
    try {
      console.log("[PRISMA USER REPO] Verificando existência por email:", email);
      
      const prisma = this._getPrismaClient();
      const count = await prisma.user.count({
        where: { email: email.toLowerCase() },
      });

      const exists = count > 0;
      console.log("[PRISMA USER REPO] Usuário existe por email:", exists);
      return exists;
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro ao verificar existência por email:", error.message);
      throw new Error(`Error checking user existence by email: ${error.message}`);
    }
  }

  /**
   * Conta o número total de usuários
   * @returns {Promise<number>} Número de usuários
   */
  async count() {
    try {
      console.log("[PRISMA USER REPO] Contando usuários");
      
      const prisma = this._getPrismaClient();
      const count = await prisma.user.count();

      console.log("[PRISMA USER REPO] Total de usuários:", count);
      return count;
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro ao contar usuários:", error.message);
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  /**
   * Busca usuários com paginação
   * @param {number} page - Página (começando em 1)
   * @param {number} limit - Limite de itens por página
   * @returns {Promise<{users: User[], total: number, page: number, totalPages: number}>}
   */
  async findWithPagination(page = 1, limit = 10) {
    try {
      console.log("[PRISMA USER REPO] Buscando usuários com paginação:", { page, limit });
      
      const prisma = this._getPrismaClient();
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);

      const totalPages = Math.ceil(total / limit);
      const result = {
        users: users.map(user => this._mapToEntity(user)),
        total,
        page,
        totalPages,
      };

      console.log("[PRISMA USER REPO] Paginação concluída:", {
        encontrados: users.length,
        total,
        página: page,
        totalPáginas: totalPages,
      });

      return result;
    } catch (error) {
      console.error("[PRISMA USER REPO] Erro na paginação:", error.message);
      throw new Error(`Error in pagination: ${error.message}`);
    }
  }
}

module.exports = PrismaUserRepository;
