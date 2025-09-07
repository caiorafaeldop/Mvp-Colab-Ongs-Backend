const IUserRepository = require("../../domain/repositories/IUserRepository");
const UserModel = require("../database/models/UserModel");
const User = require("../../domain/entities/User");

class MongoUserRepository extends IUserRepository {
  async save(user) {
    try {
      const userData = {
        name: user.name,
        email: user.email,
        password: user.password,
        userType: user.userType,
        phone: user.phone,
      };

      const savedUser = await UserModel.create(userData);
      return this._mapToEntity(savedUser);
    } catch (error) {
      throw new Error(`Error saving user: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      console.log("[MONGO USER REPO] Buscando usuário por ID:", id);
      console.log("[MONGO USER REPO] Tipo do ID:", typeof id);
      console.log("[MONGO USER REPO] Tamanho do ID:", id ? id.length : 0);
      
      const user = await UserModel.findById(id);
      console.log("[MONGO USER REPO] Usuário encontrado no MongoDB:", !!user);
      console.log("[MONGO USER REPO] Detalhes do usuário:", user ? { _id: user._id, email: user.email } : 'NENHUM');
      
      return user ? this._mapToEntity(user) : null;
    } catch (error) {
      console.error("[MONGO USER REPO] Erro ao buscar usuário:", error.message);
      throw new Error(`Error finding user by id: ${error.message}`);
    }
  }

  async findByEmail(email) {
    try {
      // Retorna o documento Mongoose, não o objeto de domínio
      return await UserModel.findOne({
        email: email.toLowerCase(),
      }).select("+password");
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  async findByUserType(userType) {
    try {
      const users = await UserModel.find({ userType });
      return users.map((user) => this._mapToEntity(user));
    } catch (error) {
      throw new Error(`Error finding users by type: ${error.message}`);
    }
  }

  async update(id, userData) {
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { ...userData, updatedAt: new Date() },
        { new: true }
      );
      return updatedUser ? this._mapToEntity(updatedUser) : null;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const deletedUser = await UserModel.findByIdAndDelete(id);
      return deletedUser ? this._mapToEntity(deletedUser) : null;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const users = await UserModel.find();
      return users.map((user) => this._mapToEntity(user));
    } catch (error) {
      throw new Error(`Error finding all users: ${error.message}`);
    }
  }

  _mapToEntity(userDoc) {
    console.log("[MONGO USER REPO] _mapToEntity - userDoc._id:", userDoc._id);
    console.log("[MONGO USER REPO] _mapToEntity - userDoc._id.toString():", userDoc._id.toString());
    
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
    
    console.log("[MONGO USER REPO] _mapToEntity - user.id:", user.id);
    console.log("[MONGO USER REPO] _mapToEntity - user completo:", {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType
    });
    
    return user;
  }
}

module.exports = MongoUserRepository;
