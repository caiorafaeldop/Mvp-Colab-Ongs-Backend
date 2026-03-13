/**
 * CONTROLLER - CarouselSlide
 */

class CarouselSlideController {
  constructor(service) {
    this.service = service;

    this.listPublic = this.listPublic.bind(this);
    this.getPublicSettings = this.getPublicSettings.bind(this);
    this.list = this.list.bind(this);
    this.getSettings = this.getSettings.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.importDefaults = this.importDefaults.bind(this);
  }

  async listPublic(req, res) {
    try {
      const data = await this.service.listPublicSlides();
      return res.status(200).json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async getPublicSettings(req, res) {
    try {
      const data = await this.service.getSectionSettings();
      return res.status(200).json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async list(req, res) {
    try {
      const data = await this.service.listSlides({
        visible: req.query.visible !== undefined ? req.query.visible === 'true' : undefined,
      });
      return res.status(200).json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async getSettings(req, res) {
    try {
      const data = await this.service.getSectionSettings();
      return res.status(200).json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async updateSettings(req, res) {
    try {
      const data = await this.service.updateSectionSettings(req.body || {});
      return res.status(200).json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async create(req, res) {
    try {
      const slide = await this.service.createSlide(req.body);
      return res.status(201).json({ success: true, data: slide });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async importDefaults(req, res) {
    try {
      const result = await this.service.importDefaultSlides();
      return res.status(200).json({ success: true, data: result });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }

  async update(req, res) {
    try {
      const slide = await this.service.updateSlide(req.params.id, req.body);
      return res.status(200).json({ success: true, data: slide });
    } catch (e) {
      const code = e.message && e.message.includes('nao encontrado') ? 404 : 400;
      return res.status(code).json({ success: false, message: e.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await this.service.deleteSlide(req.params.id);
      return res.status(200).json({ success: true, message: result.message });
    } catch (e) {
      const code = e.message && e.message.includes('nao encontrado') ? 404 : 400;
      return res.status(code).json({ success: false, message: e.message });
    }
  }
}

module.exports = CarouselSlideController;
