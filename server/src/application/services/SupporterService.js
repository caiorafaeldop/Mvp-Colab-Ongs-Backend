/**
 * SERVICE LAYER - Supporter
 */

class SupporterService {
  constructor(supporterRepository) {
    this.supporterRepository = supporterRepository;
  }

  async listPublicSupporters() {
    return this.supporterRepository.findPublic();
  }

  async listSupporters(filters) {
    return this.supporterRepository.findAll(filters || {});
  }

  async createSupporter(data) {
    if (!data || !data.name || !data.name.trim()) {
      throw new Error('Nome do colaborador é obrigatório');
    }
    const payload = {
      name: data.name.trim(),
      imageUrl: data.imageUrl || null,
      description: data.description || null,
      website: data.website || null,
      order: data.order !== undefined ? Number(data.order) : 0,
      visible: data.visible !== undefined ? !!data.visible : true,
    };
    return this.supporterRepository.create(payload);
  }

  async updateSupporter(id, data) {
    if (!id) {
      throw new Error('ID é obrigatório');
    }
    if (data.name !== undefined && data.name.trim() === '') {
      throw new Error('Nome não pode ser vazio');
    }
    return this.supporterRepository.update(id, data);
  }

  async deleteSupporter(id) {
    if (!id) {
      throw new Error('ID é obrigatório');
    }
    await this.supporterRepository.delete(id);
    return { success: true, message: 'Colaborador removido com sucesso' };
  }
}

module.exports = SupporterService;
