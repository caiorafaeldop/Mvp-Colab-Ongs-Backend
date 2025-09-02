class IUserRepository {
  async save(user) {
    throw new Error("Method save() must be implemented");
  }

  async findById(id) {
    throw new Error("Method findById() must be implemented");
  }

  async findByEmail(email) {
    throw new Error("Method findByEmail() must be implemented");
  }

  async findByUserType(userType) {
    throw new Error("Method findByUserType() must be implemented");
  }

  async update(id, userData) {
    throw new Error("Method update() must be implemented");
  }

  async delete(id) {
    throw new Error("Method delete() must be implemented");
  }

  async findAll() {
    throw new Error("Method findAll() must be implemented");
  }
}

module.exports = IUserRepository;

