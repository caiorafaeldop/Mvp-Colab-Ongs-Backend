const LocationMatchingStrategy = require('../../infra/strategies/LocationMatchingStrategy');
const CauseMatchingStrategy = require('../../infra/strategies/CauseMatchingStrategy');
const ResourceMatchingStrategy = require('../../infra/strategies/ResourceMatchingStrategy');
const OpenAILLMStrategy = require('../../infra/strategies/OpenAILLMStrategy');

/**
 * Factory para criação de estratégias
 * Centraliza a criação de diferentes tipos de estratégias seguindo o padrão Strategy + Factory
 */
class StrategyFactory {
  /**
   * Cria uma estratégia de matching baseada no tipo
   * @param {string} strategyType - Tipo da estratégia ('location', 'cause', 'resource', 'hybrid')
   * @returns {IMatchingStrategy} Instância da estratégia
   */
  static createMatchingStrategy(strategyType) {
    switch (strategyType.toLowerCase()) {
      case 'location':
        return new LocationMatchingStrategy();
      case 'cause':
        return new CauseMatchingStrategy();
      case 'resource':
        return new ResourceMatchingStrategy();
      case 'hybrid':
        return new HybridMatchingStrategy();
      default:
        throw new Error(`Unsupported matching strategy: ${strategyType}`);
    }
  }

  /**
   * Cria uma estratégia de LLM baseada no provedor
   * @param {string} provider - Nome do provedor ('openai', 'anthropic')
   * @returns {ILLMStrategy} Instância da estratégia
   */
  static createLLMStrategy(provider) {
    switch (provider.toLowerCase()) {
      case 'openai':
        return new OpenAILLMStrategy();
      case 'anthropic':
        // TODO: Implementar AnthropicLLMStrategy
        throw new Error('Anthropic LLM strategy not implemented yet');
      default:
        throw new Error(`Unsupported LLM strategy: ${provider}`);
    }
  }

  /**
   * Cria uma estratégia de matching baseada em variável de ambiente
   * @returns {IMatchingStrategy} Instância da estratégia configurada
   */
  static createDefaultMatchingStrategy() {
    const defaultStrategy = process.env.DEFAULT_MATCHING_STRATEGY || 'cause';
    return this.createMatchingStrategy(defaultStrategy);
  }

  /**
   * Cria uma estratégia de LLM baseada em variável de ambiente
   * @returns {ILLMStrategy} Instância da estratégia configurada
   */
  static createDefaultLLMStrategy() {
    const defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'openai';
    return this.createLLMStrategy(defaultProvider);
  }

  /**
   * Lista todas as estratégias de matching disponíveis
   * @returns {Array<string>} Lista de estratégias
   */
  static getAvailableMatchingStrategies() {
    return ['location', 'cause', 'resource', 'hybrid'];
  }

  /**
   * Lista todas as estratégias de LLM disponíveis
   * @returns {Array<string>} Lista de provedores
   */
  static getAvailableLLMStrategies() {
    return ['openai']; // 'anthropic' será adicionado depois
  }

  /**
   * Cria múltiplas estratégias para comparação
   * @param {Array<string>} strategyTypes - Lista de tipos de estratégia
   * @returns {Array<IMatchingStrategy>} Array de estratégias
   */
  static createMultipleMatchingStrategies(strategyTypes) {
    return strategyTypes.map(type => this.createMatchingStrategy(type));
  }
}

/**
 * Estratégia híbrida que combina múltiplas estratégias
 */
class HybridMatchingStrategy {
  constructor() {
    this.strategies = [
      new LocationMatchingStrategy(),
      new CauseMatchingStrategy(),
      new ResourceMatchingStrategy()
    ];
    this.weights = {
      'location-matching': 0.2,
      'cause-matching': 0.4,
      'resource-matching': 0.4
    };
  }

  async calculateCompatibility(requesterOrg, targetOrg, context = {}) {
    try {
      let totalScore = 0;
      let combinedDetails = {
        factors: [],
        strategyResults: {},
        finalScore: 0
      };

      for (const strategy of this.strategies) {
        const result = await strategy.calculateCompatibility(requesterOrg, targetOrg, context);
        const weight = this.weights[result.strategy] || 0.33;
        const weightedScore = result.score * weight;
        
        totalScore += weightedScore;
        combinedDetails.strategyResults[result.strategy] = {
          score: result.score,
          weightedScore,
          weight,
          details: result.details
        };
        
        if (result.details.factors) {
          combinedDetails.factors.push(...result.details.factors.map(f => `${result.strategy}: ${f}`));
        }
      }

      combinedDetails.finalScore = Math.min(1, totalScore);

      return {
        score: combinedDetails.finalScore,
        details: combinedDetails,
        strategy: 'hybrid-matching'
      };
    } catch (error) {
      return {
        score: 0,
        details: { error: error.message },
        strategy: 'hybrid-matching'
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
    return 'hybrid-matching';
  }

  getCriteria() {
    return ['location', 'causes', 'resources', 'comprehensive'];
  }

  validateOrgData(orgData) {
    return this.strategies.some(strategy => strategy.validateOrgData(orgData));
  }
}

module.exports = StrategyFactory;
