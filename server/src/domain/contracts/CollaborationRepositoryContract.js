class ICollaborationRepository {
  async save(collaboration) {
    throw new Error("Method save() must be implemented");
  }

  async findById(id) {
    throw new Error("Method findById() must be implemented");
  }

  async findByOrganizationId(organizationId) {
    throw new Error("Method findByOrganizationId() must be implemented");
  }

  async findByStatus(status) {
    throw new Error("Method findByStatus() must be implemented");
  }

  async findBetweenOrganizations(org1Id, org2Id) {
    throw new Error("Method findBetweenOrganizations() must be implemented");
  }

  async update(id, collaborationData) {
    throw new Error("Method update() must be implemented");
  }

  async delete(id) {
    throw new Error("Method delete() must be implemented");
  }

  async findAll() {
    throw new Error("Method findAll() must be implemented");
  }

  async findActiveCollaborations() {
    throw new Error("Method findActiveCollaborations() must be implemented");
  }

  async findPendingCollaborations(organizationId) {
    throw new Error("Method findPendingCollaborations() must be implemented");
  }
}

module.exports = ICollaborationRepository;
