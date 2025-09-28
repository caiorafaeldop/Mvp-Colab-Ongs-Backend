const IUserRepository = require("../../domain/repositories/IUserRepository");
const UserModel = require("../database/models/UserModel");
const User = require("../../domain/entities/User");

/**
 * Implementação MongoDB do Repository Pattern para Usuários
 * Segue os princípios SOLID e Clean Architecture
 */
class MongoUserRepository extends IUserRepository {
  /**
   * Salva um usuário no banco de dados
   * @param {User} user - Entidade de usuário do domínio
   * @returns {Promise<User>} Usuário salvo como entidade de domínio
   */
  async save(user) {
    try {
      console.log("[MONGO USER REPO] Salvando usuário:", { email: user.email, userType: user.userType });
      
      const userData = {
        name: user.name,
        email: user.email.toLowerCase(), // Normalizar email
        password: user.password,
        userType: user.userType,
        phone: user.phone,
      };

      const savedUser = await UserModel.create(userData);
      console.log("[MONGO USER REPO] Usuário salvo com sucesso:", savedUser._id);
      
      return this._mapToEntity(savedUser);
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao salvar usuário:", error.message);
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
      console.log("[MONGO USER REPO] Buscando usuário por ID:", id);
      
      const user = await UserModel.findById(id);
      console.log("[MONGO USER REPO] Usuário encontrado:", !!user);
      
      return user ? this._mapToEntity(user) : null;
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao buscar usuário por ID:", error.message);
      throw new Error(`Error finding user by id: ${error.message}`);
    }
  }

  /**
   * Busca usuário por email retornando documento MongoDB (para autenticação)
   * Este método retorna o documento com senha para verificação de login
   * @param {string} email - Email do usuário
   * @returns {Promise<MongoDocument|null>} Documento MongoDB ou null
   */
  async findByEmail(email) {
    try {
      console.log("[MONGO USER REPO] Buscando usuário por email:", email);
      
      const user = await UserModel.findOne({
        email: email.toLowerCase(),
      }).select("+password");
      
      console.log("[MONGO USER REPO] Usuário encontrado por email:", !!user);
      return user;
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao buscar usuário por email:", error.message);
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  /**
   * Busca usuários por tipo
   * @param {string} userType - Tipo do usuário
   * @returns {Promise<User[]>} Lista de entidades de usuário
   */
  async findByUserType(userType) {
    try {
      console.log("[MONGO USER REPO] Buscando usuários por tipo:", userType);
      
      const users = await UserModel.find({ userType });
      console.log("[MONGO USER REPO] Usuários encontrados:", users.length);
      
      return users.map((user) => this._mapToEntity(user));
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao buscar usuários por tipo:", error.message);
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
      console.log("[MONGO USER REPO] Atualizando usuário:", id);
      
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { ...userData, updatedAt: new Date() },
        { new: true }
      );
      
      console.log("[MONGO USER REPO] Usuário atualizado:", !!updatedUser);
      return updatedUser ? this._mapToEntity(updatedUser) : null;
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao atualizar usuário:", error.message);
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
      console.log("[MONGO USER REPO] Removendo usuário:", id);
      
      const deletedUser = await UserModel.findByIdAndDelete(id);
      console.log("[MONGO USER REPO] Usuário removido:", !!deletedUser);
      
      return deletedUser ? this._mapToEntity(deletedUser) : null;
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao remover usuário:", error.message);
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  /**
   * Busca todos os usuários
   * @returns {Promise<User[]>} Lista de todos os usuários
   */
  async findAll() {
    try {
      console.log("[MONGO USER REPO] Buscando todos os usuários");
      
      const users = await UserModel.find();
      console.log("[MONGO USER REPO] Total de usuários encontrados:", users.length);
      
      return users.map((user) => this._mapToEntity(user));
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao buscar todos os usuários:", error.message);
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
      console.log("[MONGO USER REPO] Verificando existência por email:", email);
      
      const exists = await UserModel.exists({ email: email.toLowerCase() });
      console.log("[MONGO USER REPO] Usuário existe:", !!exists);
      
      return !!exists;
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao verificar existência:", error.message);
      throw new Error(`Error checking user existence: ${error.message}`);
    }
  }

  /**
   * Conta o número total de usuários
   * @returns {Promise<number>} Número de usuários
   */
  async count() {
    try {
      console.log("[MONGO USER REPO] Contando usuários");
      
      const count = await UserModel.countDocuments();
      console.log("[MONGO USER REPO] Total de usuários:", count);
      
      return count;
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao contar usuários:", error.message);
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
      console.log("[MONGO USER REPO] Buscando usuários com paginação:", { page, limit });
      
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        UserModel.find().skip(skip).limit(limit),
        UserModel.countDocuments()
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      console.log("[MONGO USER REPO] Paginação:", { 
        usersFound: users.length, 
        total, 
        page, 
        totalPages 
      });
      
      return {
        users: users.map(user => this._mapToEntity(user)),
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error("[MONGO USER REPO] Erro na paginação:", error.message);
      throw new Error(`Error finding users with pagination: ${error.message}`);
    }
  }

  /**
   * Mapeia documento MongoDB para entidade de domínio
   * @param {MongoDocument} userDoc - Documento do MongoDB
   * @returns {User} Entidade de usuário do domínio
   * @private
   */
  _mapToEntity(userDoc) {
    console.log("[MONGO USER REPO] Mapeando documento para entidade:", userDoc._id);
    
    const user = new User(
      userDoc._id.toString(),
      userDoc.name,
      userDoc.email,
      userDoc.password,
      userDoc.userType,
      userDoc.phone,
      userDoc.createdAt,
      userDoc.updatedAt
    );
    
    console.log("[MONGO USER REPO] Entidade criada:", {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType
    });
    
    return user;
  }
}

module.exports = MongoUserRepository;
