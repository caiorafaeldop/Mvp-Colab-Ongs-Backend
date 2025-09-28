const IMatchingStrategy = require('../../domain/strategies/IMatchingStrategy');

/**
 * Estratégia de matching baseada em recursos disponíveis e necessários
 * Conecta ONGs que têm recursos com ONGs que precisam desses recursos
 */
class ResourceMatchingStrategy extends IMatchingStrategy {
  constructor() {
    super();
    this.exactResourceBonus = 0.9;
    this.similarResourceBonus = 0.6;
    this.capacityMatchBonus = 0.4;
    
    // Mapeamento de recursos similares
    this.similarResources = {
      'voluntarios': ['pessoas', 'mao-de-obra', 'equipe', 'colaboradores'],
      'dinheiro': ['financiamento', 'verba', 'recursos-financeiros', 'doacao'],
      'equipamentos': ['materiais', 'ferramentas', 'instrumentos', 'dispositivos'],
      'espaco': ['local', 'sede', 'instalacoes', 'ambiente'],
      'conhecimento': ['expertise', 'capacitacao', 'treinamento', 'consultoria'],
      'tecnologia': ['software', 'sistemas', 'ti', 'digital'],
      'transporte': ['veiculo', 'logistica', 'deslocamento'],
      'alimentacao': ['comida', 'refeicoes', 'merenda', 'nutricao']
    };
  }

  async calculateCompatibility(requesterOrg, targetOrg, context = {}) {
    try {
      let score = 0;
      let details = {
        factors: [],
        resourceMatches: [],
        capacityMatches: [],
        complementarity: 0
      };

      if (!this.validateOrgData(requesterOrg) || !this.validateOrgData(targetOrg)) {
        return {
          score: 0,
          details: { ...details, error: 'Dados de recursos insuficientes' },
          strategy: this.getStrategyName()
        };
      }

      const requesterNeeds = this.normalizeResources(requesterOrg.resourcesNeeded || []);
      const targetAvailable = this.normalizeResources(targetOrg.resourcesAvailable || []);
      const requesterAvailable = this.normalizeResources(requesterOrg.resourcesAvailable || []);
      const targetNeeds = this.normalizeResources(targetOrg.resourcesNeeded || []);

      // Matching direto: o que requester precisa vs o que target tem
      const directMatches = this.findResourceMatches(requesterNeeds, targetAvailable);
      if (directMatches.length > 0) {
        score += this.exactResourceBonus * (directMatches.length / Math.max(requesterNeeds.length, 1));
        details.resourceMatches.push(...directMatches.map(m => `Necessita: ${m.need} → Disponível: ${m.available}`));
        details.factors.push('Recursos necessários disponíveis');
      }

      // Matching reverso: o que target precisa vs o que requester tem
      const reverseMatches = this.findResourceMatches(targetNeeds, requesterAvailable);
      if (reverseMatches.length > 0) {
        score += this.exactResourceBonus * (reverseMatches.length / Math.max(targetNeeds.length, 1));
        details.resourceMatches.push(...reverseMatches.map(m => `Oferece: ${m.available} → Necessário: ${m.need}`));
        details.factors.push('Recursos oferecidos são necessários');
      }

      // Complementaridade (ambas organizações se beneficiam)
      if (directMatches.length > 0 && reverseMatches.length > 0) {
        details.complementarity = Math.min(directMatches.length, reverseMatches.length);
        score += 0.3 * details.complementarity;
        details.factors.push('Parceria mutuamente benéfica');
      }

      // Considera capacidade organizacional
      const capacityMatch = this.calculateCapacityMatch(requesterOrg, targetOrg);
      if (capacityMatch > 0) {
        score += this.capacityMatchBonus * capacityMatch;
        details.capacityMatches.push('Capacidades organizacionais compatíveis');
        details.factors.push('Tamanhos organizacionais compatíveis');
      }

      // Considera experiência em colaborações
      if (requesterOrg.collaborationHistory && targetOrg.collaborationHistory) {
        const experienceBonus = this.calculateExperienceBonus(
          requesterOrg.collaborationHistory,
          targetOrg.collaborationHistory
        );
        if (experienceBonus > 0) {
          score += experienceBonus * 0.2;
          details.factors.push('Experiência em colaborações');
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

      return matches.sort((a, b) => b.compatibility.score - a.compatibility.score);
    } catch (error) {
      throw new Error(`Error finding matches: ${error.message}`);
    }
  }

  getStrategyName() {
    return 'resource-matching';
  }

  getCriteria() {
    return ['resourcesNeeded', 'resourcesAvailable', 'organizationalCapacity', 'collaborationHistory'];
  }

  validateOrgData(orgData) {
    return orgData && (
      (orgData.resourcesNeeded && orgData.resourcesNeeded.length > 0) ||
      (orgData.resourcesAvailable && orgData.resourcesAvailable.length > 0) ||
      orgData.description
    );
  }

  normalizeResources(resources) {
    return resources.map(resource => 
      resource.toLowerCase()
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íì]/g, 'i')
        .replace(/[óòôõ]/g, 'o')
        .replace(/[úù]/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, '-')
    );
  }

  findResourceMatches(needs, available) {
    const matches = [];
    
    for (const need of needs) {
      // Match exato
      if (available.includes(need)) {
        matches.push({ need, available: need, type: 'exact' });
        continue;
      }
      
      // Match similar
      const similarList = this.similarResources[need] || [];
      for (const availableResource of available) {
        if (similarList.includes(availableResource)) {
          matches.push({ need, available: availableResource, type: 'similar' });
          break;
        }
      }
      
      // Match por palavras-chave
      for (const availableResource of available) {
        if (need.includes(availableResource) || availableResource.includes(need)) {
          matches.push({ need, available: availableResource, type: 'keyword' });
          break;
        }
      }
    }
    
    return matches;
  }

  calculateCapacityMatch(org1, org2) {
    const size1 = this.getOrganizationSize(org1);
    const size2 = this.getOrganizationSize(org2);
    
    // Organizações de tamanhos similares ou complementares
    if (size1 === size2) return 1;
    if (Math.abs(size1 - size2) === 1) return 0.7;
    if (Math.abs(size1 - size2) === 2) return 0.4;
    return 0;
  }

  getOrganizationSize(org) {
    // 1: pequena, 2: média, 3: grande
    const volunteers = org.volunteerCount || 0;
    const budget = org.annualBudget || 0;
    
    if (volunteers > 100 || budget > 1000000) return 3;
    if (volunteers > 20 || budget > 100000) return 2;
    return 1;
  }

  calculateExperienceBonus(history1, history2) {
    const exp1 = Array.isArray(history1) ? history1.length : 0;
    const exp2 = Array.isArray(history2) ? history2.length : 0;
    
    const avgExp = (exp1 + exp2) / 2;
    return Math.min(1, avgExp / 10); // Normaliza baseado em até 10 colaborações
  }
}

module.exports = ResourceMatchingStrategy;
