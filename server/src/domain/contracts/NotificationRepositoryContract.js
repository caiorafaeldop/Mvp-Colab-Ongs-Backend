class INotificationRepository {
  async save(notification) {
    throw new Error("Method save() must be implemented");
  }

  async findById(id) {
    throw new Error("Method findById() must be implemented");
  }

  async findByUserId(userId) {
    throw new Error("Method findByUserId() must be implemented");
  }

  async findByType(type) {
    throw new Error("Method findByType() must be implemented");
  }

  async findUnreadByUserId(userId) {
    throw new Error("Method findUnreadByUserId() must be implemented");
  }

  async markAsRead(id) {
    throw new Error("Method markAsRead() must be implemented");
  }

  async markAllAsRead(userId) {
    throw new Error("Method markAllAsRead() must be implemented");
  }

  async update(id, notificationData) {
    throw new Error("Method update() must be implemented");
  }

  async delete(id) {
    throw new Error("Method delete() must be implemented");
  }

  async findAll() {
    throw new Error("Method findAll() must be implemented");
  }

  async findByDateRange(startDate, endDate) {
    throw new Error("Method findByDateRange() must be implemented");
  }
}

module.exports = INotificationRepository;
