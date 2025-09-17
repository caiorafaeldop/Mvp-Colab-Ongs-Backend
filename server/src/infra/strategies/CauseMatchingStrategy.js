const IMatchingStrategy = require('../../domain/strategies/IMatchingStrategy');

/**
 * Estratégia de matching baseada em causas e áreas de atuação
 * Prioriza ONGs que trabalham com causas similares ou complementares
 */
class CauseMatchingStrategy extends IMatchingStrategy {
  constructor() {
    super();
    this.exactMatchBonus = 0.8;
    this.relatedCauseBonus = 0.5;
    this.complementaryBonus = 0.6;
    
    // Mapeamento de causas relacionadas
    this.relatedCauses = {
      'educacao': ['criancas', 'jovens', 'capacitacao', 'tecnologia'],
      'saude': ['criancas', 'idosos', 'mulheres', 'prevencao'],
      'meio-ambiente': ['sustentabilidade', 'reciclagem', 'energia-limpa'],
      'assistencia-social': ['criancas', 'idosos', 'familias', 'moradores-rua'],
      'direitos-humanos': ['mulheres', 'lgbtqi', 'racismo', 'inclusao'],
      'cultura': ['arte', 'musica', 'literatura', 'patrimonio'],
      'esporte': ['criancas', 'jovens', 'inclusao', 'saude']
    };

    // Causas complementares (que se beneficiam mutuamente)
    this.complementaryCauses = {
      'educacao': ['tecnologia', 'cultura', 'esporte'],
      'saude': ['educacao', 'esporte', 'meio-ambiente'],
      'meio-ambiente': ['educacao', 'saude', 'sustentabilidade'],
      'assistencia-social': ['saude', 'educacao', 'direitos-humanos']
    };
  }

  async calculateCompatibility(requesterOrg, targetOrg, context = {}) {
    try {
      let score = 0;
      let details = {
        factors: [],
        exactMatches: [],
        relatedMatches: [],
        complementaryMatches: []
      };

      if (!this.validateOrgData(requesterOrg) || !this.validateOrgData(targetOrg)) {
        return {
          score: 0,
          details: { ...details, error: 'Dados de causas insuficientes' },
          strategy: this.getStrategyName()
        };
      }

      const requesterCauses = this.normalizeCauses(requesterOrg.causes || []);
      const targetCauses = this.normalizeCauses(targetOrg.causes || []);

      // Matches exatos
      const exactMatches = requesterCauses.filter(cause => 
        targetCauses.includes(cause)
      );
      
      if (exactMatches.length > 0) {
        score += this.exactMatchBonus * (exactMatches.length / Math.max(requesterCauses.length, 1));
        details.exactMatches = exactMatches;
        details.factors.push(`Causas idênticas: ${exactMatches.join(', ')}`);
      }

      // Causas relacionadas
      const relatedMatches = this.findRelatedCauses(requesterCauses, targetCauses);
      if (relatedMatches.length > 0) {
        score += this.relatedCauseBonus * (relatedMatches.length / Math.max(requesterCauses.length, 1));
        details.relatedMatches = relatedMatches;
        details.factors.push(`Causas relacionadas: ${relatedMatches.join(', ')}`);
      }

      // Causas complementares
      const complementaryMatches = this.findComplementaryCauses(requesterCauses, targetCauses);
      if (complementaryMatches.length > 0) {
        score += this.complementaryBonus * (complementaryMatches.length / Math.max(requesterCauses.length, 1));
        details.complementaryMatches = complementaryMatches;
        details.factors.push(`Causas complementares: ${complementaryMatches.join(', ')}`);
      }

      // Considera público-alvo similar
      if (requesterOrg.targetAudience && targetOrg.targetAudience) {
        const audienceMatch = this.calculateAudienceMatch(
          requesterOrg.targetAudience,
          targetOrg.targetAudience
        );
        if (audienceMatch > 0) {
          score += audienceMatch * 0.3;
          details.factors.push('Público-alvo similar');
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
    return 'cause-matching';
  }

  getCriteria() {
    return ['causes', 'targetAudience', 'missionAlignment'];
  }

  validateOrgData(orgData) {
    return orgData && (
      (orgData.causes && orgData.causes.length > 0) ||
      orgData.mainCause ||
      orgData.description
    );
  }

  normalizeCauses(causes) {
    return causes.map(cause => 
      cause.toLowerCase()
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íì]/g, 'i')
        .replace(/[óòôõ]/g, 'o')
        .replace(/[úù]/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/\s+/g, '-')
    );
  }

  findRelatedCauses(requesterCauses, targetCauses) {
    const related = [];
    
    for (const requesterCause of requesterCauses) {
      const relatedList = this.relatedCauses[requesterCause] || [];
      for (const targetCause of targetCauses) {
        if (relatedList.includes(targetCause)) {
          related.push(`${requesterCause} → ${targetCause}`);
        }
      }
    }
    
    return related;
  }

  findComplementaryCauses(requesterCauses, targetCauses) {
    const complementary = [];
    
    for (const requesterCause of requesterCauses) {
      const complementaryList = this.complementaryCauses[requesterCause] || [];
      for (const targetCause of targetCauses) {
        if (complementaryList.includes(targetCause)) {
          complementary.push(`${requesterCause} + ${targetCause}`);
        }
      }
    }
    
    return complementary;
  }

  calculateAudienceMatch(audience1, audience2) {
    const audiences1 = Array.isArray(audience1) ? audience1 : [audience1];
    const audiences2 = Array.isArray(audience2) ? audience2 : [audience2];
    
    const matches = audiences1.filter(aud => 
      audiences2.some(aud2 => 
        aud.toLowerCase().includes(aud2.toLowerCase()) ||
        aud2.toLowerCase().includes(aud.toLowerCase())
      )
    );
    
    return matches.length / Math.max(audiences1.length, audiences2.length, 1);
  }
}

module.exports = CauseMatchingStrategy;
