/**
 * CONTROLLER - Supporter
 */

class SupporterController {
  constructor(service) {
    this.service = service;

    this.listPublic = this.listPublic.bind(this);
    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async listPublic(req, res) {
    try {
      const data = await this.service.listPublicSupporters();
      return res.status(200).json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async list(req, res) {
    try {
      const data = await this.service.listSupporters({
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        visible: req.query.visible !== undefined ? req.query.visible === 'true' : undefined,
      });
      return res.status(200).json({ success: true, ...data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async create(req, res) {
    try {
      const supporter = await this.service.createSupporter(req.body);
      return res.status(201).json({ success: true, data: supporter });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async update(req, res) {
    try {
      const supporter = await this.service.updateSupporter(req.params.id, req.body);
      return res.status(200).json({ success: true, data: supporter });
    } catch (e) {
      const code = e.message && e.message.includes('não encontrado') ? 404 : 400;
      return res.status(code).json({ success: false, message: e.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await this.service.deleteSupporter(req.params.id);
      return res.status(200).json({ success: true, message: result.message });
    } catch (e) {
      const code = e.message && e.message.includes('não encontrado') ? 404 : 400;
      return res.status(code).json({ success: false, message: e.message });
    }
  }
}

module.exports = SupporterController;
