/**
 * SERVICE LAYER - CarouselSlide
 */

const { DEFAULT_CAROUSEL_SLIDES } = require('../constants/defaultCarouselSlides');
const {
  DEFAULT_CAROUSEL_SECTION_SETTINGS,
} = require('../constants/defaultCarouselSectionSettings');

const CAROUSEL_SECTION_KEY = 'donations';

class CarouselSlideService {
  constructor(carouselSlideRepository, carouselSectionSettingsRepository = null) {
    this.carouselSlideRepository = carouselSlideRepository;
    this.carouselSectionSettingsRepository = carouselSectionSettingsRepository;
  }

  _normalizeText(value) {
    if (value === undefined || value === null) {
      return null;
    }
    const text = String(value).trim();
    return text || null;
  }

  async listPublicSlides() {
    return this.carouselSlideRepository.findPublic();
  }

  async listSlides(filters) {
    return this.carouselSlideRepository.findAll(filters || {});
  }

  async listThemes() {
    const slides = await this.carouselSlideRepository.findAll({});
    const themeMap = new Map();

    for (const slide of slides) {
      const theme = slide.theme || null;
      const key = theme || '__none__';
      if (!themeMap.has(key)) {
        themeMap.set(key, { theme, count: 0, visibleCount: 0 });
      }
      const entry = themeMap.get(key);
      entry.count += 1;
      if (slide.visible) {
        entry.visibleCount += 1;
      }
    }

    return Array.from(themeMap.values()).sort((a, b) => {
      if (!a.theme) {
        return 1;
      }
      if (!b.theme) {
        return -1;
      }
      return a.theme.localeCompare(b.theme, 'pt-BR');
    });
  }

  async getSectionSettings() {
    if (!this.carouselSectionSettingsRepository) {
      return { ...DEFAULT_CAROUSEL_SECTION_SETTINGS };
    }

    const savedSettings =
      await this.carouselSectionSettingsRepository.findBySection(CAROUSEL_SECTION_KEY);

    if (!savedSettings) {
      return { ...DEFAULT_CAROUSEL_SECTION_SETTINGS };
    }

    return {
      title: savedSettings.title,
      subtitle: savedSettings.subtitle,
    };
  }

  async updateSectionSettings(data) {
    const title = this._normalizeText(data?.title);
    const subtitle = this._normalizeText(data?.subtitle);

    if (!title) {
      throw new Error('Titulo e obrigatorio');
    }

    if (!subtitle) {
      throw new Error('Subtitulo e obrigatorio');
    }

    if (!this.carouselSectionSettingsRepository) {
      throw new Error('Repositorio de configuracao nao disponivel');
    }

    const savedSettings = await this.carouselSectionSettingsRepository.upsertBySection({
      section: CAROUSEL_SECTION_KEY,
      title,
      subtitle,
    });

    return {
      title: savedSettings.title,
      subtitle: savedSettings.subtitle,
    };
  }

  async importDefaultSlides() {
    const existingSlides = await this.carouselSlideRepository.findAll({});
    const slideByImageUrl = new Map(existingSlides.map((slide) => [slide.imageUrl, slide]));

    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const defaultSlide of DEFAULT_CAROUSEL_SLIDES) {
      const payload = {
        imageUrl: defaultSlide.imageUrl,
        caption: this._normalizeText(defaultSlide.caption),
        altText: this._normalizeText(defaultSlide.altText),
        theme: this._normalizeText(defaultSlide.theme),
        order: Number(defaultSlide.order) || 0,
        visible: defaultSlide.visible !== undefined ? !!defaultSlide.visible : true,
      };

      const existing = slideByImageUrl.get(payload.imageUrl);

      if (!existing) {
        await this.carouselSlideRepository.create(payload);
        created += 1;
        continue;
      }

      const hasChanges =
        existing.caption !== payload.caption ||
        existing.altText !== payload.altText ||
        existing.theme !== payload.theme ||
        Number(existing.order) !== Number(payload.order) ||
        !!existing.visible !== !!payload.visible;

      if (hasChanges) {
        await this.carouselSlideRepository.update(existing.id, payload);
        updated += 1;
      } else {
        unchanged += 1;
      }
    }

    const totalSlides = (await this.carouselSlideRepository.findAll({})).length;

    return {
      created,
      updated,
      unchanged,
      total: totalSlides,
      defaults: DEFAULT_CAROUSEL_SLIDES.length,
    };
  }

  async createSlide(data) {
    if (!data || !data.imageUrl || !String(data.imageUrl).trim()) {
      throw new Error('URL da imagem e obrigatoria');
    }

    const payload = {
      imageUrl: String(data.imageUrl).trim(),
      caption: this._normalizeText(data.caption),
      altText: this._normalizeText(data.altText),
      theme: this._normalizeText(data.theme),
      order: data.order !== undefined ? Number(data.order) : 0,
      visible: data.visible !== undefined ? !!data.visible : true,
    };

    return this.carouselSlideRepository.create(payload);
  }

  async updateSlide(id, data) {
    if (!id) {
      throw new Error('ID e obrigatorio');
    }

    if (data.imageUrl !== undefined && !String(data.imageUrl).trim()) {
      throw new Error('URL da imagem nao pode ser vazia');
    }

    const payload = {};

    if (data.imageUrl !== undefined) {
      payload.imageUrl = String(data.imageUrl).trim();
    }
    if (data.caption !== undefined) {
      payload.caption = this._normalizeText(data.caption);
    }
    if (data.altText !== undefined) {
      payload.altText = this._normalizeText(data.altText);
    }
    if (data.theme !== undefined) {
      payload.theme = this._normalizeText(data.theme);
    }
    if (data.order !== undefined) {
      payload.order = Number(data.order);
    }
    if (data.visible !== undefined) {
      payload.visible = !!data.visible;
    }

    const updated = await this.carouselSlideRepository.update(id, payload);
    if (!updated) {
      throw new Error('Slide nao encontrado');
    }

    return updated;
  }

  async deleteSlide(id) {
    if (!id) {
      throw new Error('ID e obrigatorio');
    }

    const deleted = await this.carouselSlideRepository.delete(id);
    if (!deleted) {
      throw new Error('Slide nao encontrado');
    }

    return { success: true, message: 'Slide removido com sucesso' };
  }
}

module.exports = CarouselSlideService;
