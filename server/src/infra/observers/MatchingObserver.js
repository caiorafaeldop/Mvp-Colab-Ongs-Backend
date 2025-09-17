const IObserver = require('../../domain/observers/IObserver');

/**
 * Observer para eventos de matching entre ONGs
 * Processa eventos relacionados a descoberta de matches e compatibilidade
 */
class MatchingObserver extends IObserver {
  constructor(notificationRepository, collaborationRepository) {
    super();
    this.notificationRepository = notificationRepository;
    this.collaborationRepository = collaborationRepository;
    this.name = 'MatchingObserver';
  }

  /**
   * Processa eventos de matching
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async update(event, context = {}) {
    try {
      switch (event.type) {
        case 'matching.found':
          await this.handleMatchFound(event.data, context);
          break;
        case 'matching.score_calculated':
          await this.handleScoreCalculated(event.data, context);
          break;
        case 'matching.strategy_changed':
          await this.handleStrategyChanged(event.data, context);
          break;
        case 'matching.batch_completed':
          await this.handleBatchCompleted(event.data, context);
          break;
        default:
          console.log(`[MatchingObserver] Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error(`[MatchingObserver] Erro ao processar evento ${event.type}:`, error.message);
    }
  }

  /**
   * Trata evento de match encontrado
   * @param {Object} data - Dados do match
   * @param {Object} context - Contexto
   */
  async handleMatchFound(data, context) {
    const { sourceOng, targetOng, score, strategy, details } = data;

    console.log(`[MatchingObserver] Match encontrado: ${sourceOng.name} <-> ${targetOng.name} (Score: ${score})`);

    // Cria notificação para a ONG de origem
    if (this.notificationRepository) {
      await this.notificationRepository.create({
        userId: sourceOng._id,
        type: 'match_found',
        title: 'Nova Oportunidade de Colaboração!',
        message: `Encontramos uma ONG compatível: ${targetOng.name} (Compatibilidade: ${Math.round(score * 100)}%)`,
        data: {
          matchedOngId: targetOng._id,
          matchedOngName: targetOng.name,
          score: score,
          strategy: strategy,
          details: details,
          matchId: context.matchId || `match_${Date.now()}`
        },
        priority: score > 0.8 ? 'high' : score > 0.6 ? 'medium' : 'low'
      });

      // Se o score for muito alto, cria notificação para ambas as ONGs
      if (score > 0.8) {
        await this.notificationRepository.create({
          userId: targetOng._id,
          type: 'high_compatibility_match',
          title: 'Match de Alta Compatibilidade!',
          message: `${sourceOng.name} tem alta compatibilidade com sua ONG (${Math.round(score * 100)}%)`,
          data: {
            matchedOngId: sourceOng._id,
            matchedOngName: sourceOng.name,
            score: score,
            strategy: strategy,
            details: details,
            matchId: context.matchId || `match_${Date.now()}`
          },
          priority: 'high'
        });
      }
    }

    // Se o score for excepcional, sugere colaboração automática
    if (score > 0.9 && this.collaborationRepository) {
      await this.suggestCollaboration(sourceOng, targetOng, score, details);
    }
  }

  /**
   * Trata evento de cálculo de score
   * @param {Object} data - Dados do score
   * @param {Object} context - Contexto
   */
  async handleScoreCalculated(data, context) {
    const { ongId, totalMatches, averageScore, strategy } = data;

    console.log(`[MatchingObserver] Score calculado para ONG ${ongId}: ${totalMatches} matches, média ${averageScore}`);

    // Se a ONG tem poucos matches, cria notificação com sugestões
    if (totalMatches < 3 && this.notificationRepository) {
      await this.notificationRepository.create({
        userId: ongId,
        type: 'low_matches_suggestion',
        title: 'Poucas Oportunidades Encontradas',
        message: 'Considere atualizar seu perfil ou expandir suas áreas de atuação para encontrar mais colaborações.',
        data: {
          totalMatches,
          averageScore,
          strategy,
          suggestions: this.generateImprovementSuggestions(averageScore)
        },
        priority: 'medium'
      });
    }
  }

  /**
   * Trata mudança de estratégia
   * @param {Object} data - Dados da mudança
   * @param {Object} context - Contexto
   */
  async handleStrategyChanged(data, context) {
    const { ongId, oldStrategy, newStrategy, reason } = data;

    console.log(`[MatchingObserver] Estratégia alterada para ONG ${ongId}: ${oldStrategy} -> ${newStrategy}`);

    if (this.notificationRepository) {
      await this.notificationRepository.create({
        userId: ongId,
        type: 'strategy_changed',
        title: 'Estratégia de Matching Atualizada',
        message: `Sua estratégia de busca foi otimizada para: ${newStrategy}`,
        data: {
          oldStrategy,
          newStrategy,
          reason,
          expectedImprovement: 'Melhores matches baseados no seu perfil'
        },
        priority: 'low'
      });
    }
  }

  /**
   * Trata conclusão de lote de matching
   * @param {Object} data - Dados do lote
   * @param {Object} context - Contexto
   */
  async handleBatchCompleted(data, context) {
    const { totalOngs, totalMatches, averageScore, duration, strategy } = data;

    console.log(`[MatchingObserver] Lote concluído: ${totalOngs} ONGs, ${totalMatches} matches em ${duration}ms`);

    // Log para métricas do sistema
    console.log(`[MatchingObserver] Métricas - Estratégia: ${strategy}, Score médio: ${averageScore}`);
  }

  /**
   * Sugere colaboração automática para matches excepcionais
   * @param {Object} sourceOng - ONG de origem
   * @param {Object} targetOng - ONG alvo
   * @param {number} score - Score do match
   * @param {Object} details - Detalhes do match
   */
  async suggestCollaboration(sourceOng, targetOng, score, details) {
    try {
      const collaborationData = {
        requesterOngId: sourceOng._id,
        targetOngId: targetOng._id,
        type: 'suggested',
        title: `Colaboração Sugerida - Alta Compatibilidade (${Math.round(score * 100)}%)`,
        description: `Sistema identificou alta compatibilidade entre as organizações baseado em: ${details.reasons?.join(', ') || 'múltiplos fatores'}`,
        status: 'suggested',
        matchScore: score,
        matchDetails: details,
        suggestedAt: new Date(),
        autoSuggested: true
      };

      await this.collaborationRepository.create(collaborationData);

      console.log(`[MatchingObserver] Colaboração sugerida automaticamente entre ${sourceOng.name} e ${targetOng.name}`);
    } catch (error) {
      console.error('[MatchingObserver] Erro ao sugerir colaboração:', error.message);
    }
  }

  /**
   * Gera sugestões de melhoria baseadas no score
   * @param {number} averageScore - Score médio
   * @returns {Array<string>} Lista de sugestões
   */
  generateImprovementSuggestions(averageScore) {
    const suggestions = [];

    if (averageScore < 0.3) {
      suggestions.push('Complete todas as informações do seu perfil');
      suggestions.push('Adicione mais detalhes sobre suas causas e atividades');
      suggestions.push('Inclua informações sobre recursos disponíveis');
    } else if (averageScore < 0.6) {
      suggestions.push('Considere expandir suas áreas de atuação');
      suggestions.push('Atualize informações sobre localização e alcance');
      suggestions.push('Adicione mais recursos ou necessidades');
    } else {
      suggestions.push('Seu perfil está bem otimizado');
      suggestions.push('Continue ativo na plataforma para mais oportunidades');
    }

    return suggestions;
  }

  /**
   * Retorna o nome do observer
   * @returns {string} Nome do observer
   */
  getName() {
    return this.name;
  }

  /**
   * Retorna os tipos de evento que este observer escuta
   * @returns {Array<string>} Lista de tipos de evento
   */
  getEventTypes() {
    return [
      'matching.found',
      'matching.score_calculated',
      'matching.strategy_changed',
      'matching.batch_completed'
    ];
  }
}

module.exports = MatchingObserver;
