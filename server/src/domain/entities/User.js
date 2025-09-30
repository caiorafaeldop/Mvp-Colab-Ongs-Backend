class User {
  constructor(id, name, email, password, userType, phone, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.userType = userType; // 'common' ou 'organization'
    this.phone = phone;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  static createCommonUser(name, email, password, phone) {
    return new User(null, name, email, password, 'common', phone);
  }

  static createOrganizationUser(name, email, password, phone) {
    return new User(null, name, email, password, 'organization', phone);
  }

  updateProfile(name, phone) {
    this.name = name;
    this.phone = phone;
    this.updatedAt = new Date();
  }

  changePassword(newPassword) {
    this.password = newPassword;
    this.updatedAt = new Date();
  }
}

module.exports = User;
