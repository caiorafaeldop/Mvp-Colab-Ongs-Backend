const IMatchingStrategy = require('../../domain/strategies/IMatchingStrategy');

/**
 * Estratégia de matching baseada em proximidade geográfica
 * Prioriza ONGs que estão na mesma região ou próximas
 */
class LocationMatchingStrategy extends IMatchingStrategy {
  constructor() {
    super();
    this.maxDistance = 100; // km
    this.sameStateBonus = 0.3;
    this.sameCityBonus = 0.5;
  }

  async calculateCompatibility(requesterOrg, targetOrg, context = {}) {
    try {
      let score = 0;
      let details = {
        factors: [],
        distance: null,
        sameState: false,
        sameCity: false
      };

      // Verifica se tem dados de localização
      if (!this.validateOrgData(requesterOrg) || !this.validateOrgData(targetOrg)) {
        return {
          score: 0,
          details: { ...details, error: 'Dados de localização insuficientes' },
          strategy: this.getStrategyName()
        };
      }

      // Mesmo estado
      if (requesterOrg.state && targetOrg.state) {
        if (requesterOrg.state.toLowerCase() === targetOrg.state.toLowerCase()) {
          score += this.sameStateBonus;
          details.sameState = true;
          details.factors.push('Mesmo estado');
        }
      }

      // Mesma cidade
      if (requesterOrg.city && targetOrg.city) {
        if (requesterOrg.city.toLowerCase() === targetOrg.city.toLowerCase()) {
          score += this.sameCityBonus;
          details.sameCity = true;
          details.factors.push('Mesma cidade');
        }
      }

      // Cálculo de distância (simulado - em produção usaria API de geolocalização)
      if (requesterOrg.coordinates && targetOrg.coordinates) {
        const distance = this.calculateDistance(
          requesterOrg.coordinates,
          targetOrg.coordinates
        );
        details.distance = distance;

        if (distance <= this.maxDistance) {
          const proximityScore = Math.max(0, (this.maxDistance - distance) / this.maxDistance);
          score += proximityScore * 0.4;
          details.factors.push(`Distância: ${distance.toFixed(1)}km`);
        }
      }

      // Normaliza score para 0-1
      score = Math.min(1, score);

      return {
        score,
        details,
        strategy: this.getStrategyName()
      };
    } catch (error) {
      return {
        score: 0,
        details: { error: error.message },
        strategy: this.getStrategyName()
      };
    }
  }

  async findBestMatches(requesterOrg, candidateOrgs, criteria = {}) {
    try {
      const matches = [];

      for (const candidate of candidateOrgs) {
        const compatibility = await this.calculateCompatibility(requesterOrg, candidate, criteria);
        if (compatibility.score > 0) {
          matches.push({
            org: candidate,
            compatibility
          });
        }
      }

      // Ordena por score decrescente
      return matches.sort((a, b) => b.compatibility.score - a.compatibility.score);
    } catch (error) {
      throw new Error(`Error finding matches: ${error.message}`);
    }
  }

  getStrategyName() {
    return 'location-matching';
  }

  getCriteria() {
    return ['location', 'state', 'city', 'coordinates', 'distance'];
  }

  validateOrgData(orgData) {
    return orgData && (
      (orgData.state || orgData.city) || 
      (orgData.coordinates && orgData.coordinates.lat && orgData.coordinates.lng)
    );
  }

  /**
   * Calcula distância entre duas coordenadas usando fórmula de Haversine
   * @param {Object} coord1 - {lat, lng}
   * @param {Object} coord2 - {lat, lng}
   * @returns {number} Distância em km
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = LocationMatchingStrategy;
