const IObserver = require('../../domain/observers/IObserver');

/**
 * Observer para eventos de colaboração entre ONGs
 * Monitora o ciclo de vida das colaborações e gera notificações relevantes
 */
class CollaborationObserver extends IObserver {
  constructor(notificationRepository, userRepository) {
    super();
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.name = 'CollaborationObserver';
  }

  /**
   * Processa eventos de colaboração
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async update(event, context = {}) {
    try {
      switch (event.type) {
        case 'collaboration.created':
          await this.handleCollaborationCreated(event.data, context);
          break;
        case 'collaboration.accepted':
          await this.handleCollaborationAccepted(event.data, context);
          break;
        case 'collaboration.rejected':
          await this.handleCollaborationRejected(event.data, context);
          break;
        case 'collaboration.completed':
          await this.handleCollaborationCompleted(event.data, context);
          break;
        case 'collaboration.cancelled':
          await this.handleCollaborationCancelled(event.data, context);
          break;
        case 'collaboration.updated':
          await this.handleCollaborationUpdated(event.data, context);
          break;
        default:
          console.log(`[CollaborationObserver] Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error(`[CollaborationObserver] Erro ao processar evento ${event.type}:`, error.message);
    }
  }

  /**
   * Trata criação de nova colaboração
   * @param {Object} data - Dados da colaboração
   * @param {Object} context - Contexto
   */
  async handleCollaborationCreated(data, context) {
    const { collaboration, requesterOng, targetOng } = data;

    console.log(`[CollaborationObserver] Nova colaboração criada: ${collaboration._id}`);

    if (this.notificationRepository) {
      // Notifica a ONG alvo sobre a nova proposta
      await this.notificationRepository.create({
        userId: collaboration.targetOngId,
        type: 'collaboration_request',
        title: 'Nova Proposta de Colaboração!',
        message: `${requesterOng?.name || 'Uma ONG'} enviou uma proposta de colaboração: "${collaboration.title}"`,
        data: {
          collaborationId: collaboration._id,
          requesterOngId: collaboration.requesterOngId,
          requesterOngName: requesterOng?.name,
          collaborationType: collaboration.type,
          title: collaboration.title
        },
        priority: 'high'
      });

      // Confirma para o solicitante
      await this.notificationRepository.create({
        userId: collaboration.requesterOngId,
        type: 'collaboration_sent',
        title: 'Proposta Enviada com Sucesso',
        message: `Sua proposta de colaboração foi enviada para ${targetOng?.name || 'a ONG'}`,
        data: {
          collaborationId: collaboration._id,
          targetOngId: collaboration.targetOngId,
          targetOngName: targetOng?.name,
          title: collaboration.title
        },
        priority: 'medium'
      });
    }
  }

  /**
   * Trata aceitação de colaboração
   * @param {Object} data - Dados da colaboração
   * @param {Object} context - Contexto
   */
  async handleCollaborationAccepted(data, context) {
    const { collaboration, requesterOng, targetOng } = data;

    console.log(`[CollaborationObserver] Colaboração aceita: ${collaboration._id}`);

    if (this.notificationRepository) {
      // Notifica o solicitante sobre a aceitação
      await this.notificationRepository.create({
        userId: collaboration.requesterOngId,
        type: 'collaboration_accepted',
        title: 'Colaboração Aceita! 🎉',
        message: `${targetOng?.name || 'A ONG'} aceitou sua proposta de colaboração: "${collaboration.title}"`,
        data: {
          collaborationId: collaboration._id,
          targetOngId: collaboration.targetOngId,
          targetOngName: targetOng?.name,
          title: collaboration.title,
          nextSteps: 'Entre em contato para definir os próximos passos'
        },
        priority: 'high'
      });

      // Confirma para quem aceitou
      await this.notificationRepository.create({
        userId: collaboration.targetOngId,
        type: 'collaboration_confirmed',
        title: 'Colaboração Confirmada',
        message: `Você aceitou a colaboração "${collaboration.title}" com ${requesterOng?.name || 'a ONG'}`,
        data: {
          collaborationId: collaboration._id,
          requesterOngId: collaboration.requesterOngId,
          requesterOngName: requesterOng?.name,
          title: collaboration.title
        },
        priority: 'medium'
      });
    }

    // Log para métricas
    console.log(`[CollaborationObserver] Métricas - Colaboração aceita em ${this.calculateResponseTime(collaboration)}`);
  }

  /**
   * Trata rejeição de colaboração
   * @param {Object} data - Dados da colaboração
   * @param {Object} context - Contexto
   */
  async handleCollaborationRejected(data, context) {
    const { collaboration, requesterOng, targetOng, reason } = data;

    console.log(`[CollaborationObserver] Colaboração rejeitada: ${collaboration._id}`);

    if (this.notificationRepository) {
      // Notifica o solicitante sobre a rejeição
      await this.notificationRepository.create({
        userId: collaboration.requesterOngId,
        type: 'collaboration_rejected',
        title: 'Proposta Não Aceita',
        message: `${targetOng?.name || 'A ONG'} não pode aceitar sua proposta de colaboração no momento`,
        data: {
          collaborationId: collaboration._id,
          targetOngId: collaboration.targetOngId,
          targetOngName: targetOng?.name,
          title: collaboration.title,
          reason: reason || 'Não especificado',
          suggestion: 'Considere ajustar sua proposta ou tentar novamente mais tarde'
        },
        priority: 'medium'
      });
    }
  }

  /**
   * Trata conclusão de colaboração
   * @param {Object} data - Dados da colaboração
   * @param {Object} context - Contexto
   */
  async handleCollaborationCompleted(data, context) {
    const { collaboration, requesterOng, targetOng, results } = data;

    console.log(`[CollaborationObserver] Colaboração concluída: ${collaboration._id}`);

    if (this.notificationRepository) {
      // Notifica ambas as ONGs sobre a conclusão
      const completionMessage = `Colaboração "${collaboration.title}" foi concluída com sucesso!`;
      
      await this.notificationRepository.create({
        userId: collaboration.requesterOngId,
        type: 'collaboration_completed',
        title: 'Colaboração Concluída! ✅',
        message: completionMessage,
        data: {
          collaborationId: collaboration._id,
          partnerOngId: collaboration.targetOngId,
          partnerOngName: targetOng?.name,
          title: collaboration.title,
          results: results,
          duration: this.calculateDuration(collaboration)
        },
        priority: 'high'
      });

      await this.notificationRepository.create({
        userId: collaboration.targetOngId,
        type: 'collaboration_completed',
        title: 'Colaboração Concluída! ✅',
        message: completionMessage,
        data: {
          collaborationId: collaboration._id,
          partnerOngId: collaboration.requesterOngId,
          partnerOngName: requesterOng?.name,
          title: collaboration.title,
          results: results,
          duration: this.calculateDuration(collaboration)
        },
        priority: 'high'
      });
    }

    // Log para métricas de sucesso
    console.log(`[CollaborationObserver] Métricas - Colaboração concluída em ${this.calculateDuration(collaboration)}`);
  }

  /**
   * Trata cancelamento de colaboração
   * @param {Object} data - Dados da colaboração
   * @param {Object} context - Contexto
   */
  async handleCollaborationCancelled(data, context) {
    const { collaboration, requesterOng, targetOng, reason, cancelledBy } = data;

    console.log(`[CollaborationObserver] Colaboração cancelada: ${collaboration._id}`);

    if (this.notificationRepository) {
      const cancellerName = cancelledBy === collaboration.requesterOngId ? 
        requesterOng?.name : targetOng?.name;
      const otherPartyId = cancelledBy === collaboration.requesterOngId ? 
        collaboration.targetOngId : collaboration.requesterOngId;

      // Notifica a outra parte sobre o cancelamento
      await this.notificationRepository.create({
        userId: otherPartyId,
        type: 'collaboration_cancelled',
        title: 'Colaboração Cancelada',
        message: `A colaboração "${collaboration.title}" foi cancelada por ${cancellerName}`,
        data: {
          collaborationId: collaboration._id,
          cancelledBy: cancelledBy,
          cancellerName: cancellerName,
          title: collaboration.title,
          reason: reason || 'Não especificado'
        },
        priority: 'medium'
      });
    }
  }

  /**
   * Trata atualização de colaboração
   * @param {Object} data - Dados da colaboração
   * @param {Object} context - Contexto
   */
  async handleCollaborationUpdated(data, context) {
    const { collaboration, changes, updatedBy } = data;

    console.log(`[CollaborationObserver] Colaboração atualizada: ${collaboration._id}`);

    if (this.notificationRepository && changes && Object.keys(changes).length > 0) {
      const otherPartyId = updatedBy === collaboration.requesterOngId ? 
        collaboration.targetOngId : collaboration.requesterOngId;

      // Notifica sobre mudanças significativas
      const significantChanges = ['title', 'description', 'status', 'deadline'];
      const hasSignificantChanges = significantChanges.some(field => changes[field]);

      if (hasSignificantChanges) {
        await this.notificationRepository.create({
          userId: otherPartyId,
          type: 'collaboration_updated',
          title: 'Colaboração Atualizada',
          message: `A colaboração "${collaboration.title}" foi atualizada`,
          data: {
            collaborationId: collaboration._id,
            changes: changes,
            updatedBy: updatedBy,
            title: collaboration.title
          },
          priority: 'low'
        });
      }
    }
  }

  /**
   * Calcula tempo de resposta para uma colaboração
   * @param {Object} collaboration - Dados da colaboração
   * @returns {string} Tempo formatado
   */
  calculateResponseTime(collaboration) {
    if (!collaboration.createdAt || !collaboration.acceptedAt) {
      return 'N/A';
    }

    const diffMs = new Date(collaboration.acceptedAt) - new Date(collaboration.createdAt);
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours} horas`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} dias`;
    }
  }

  /**
   * Calcula duração total de uma colaboração
   * @param {Object} collaboration - Dados da colaboração
   * @returns {string} Duração formatada
   */
  calculateDuration(collaboration) {
    if (!collaboration.acceptedAt || !collaboration.completedAt) {
      return 'N/A';
    }

    const diffMs = new Date(collaboration.completedAt) - new Date(collaboration.acceptedAt);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} dias`;
    } else {
      const diffMonths = Math.round(diffDays / 30);
      return `${diffMonths} meses`;
    }
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
      'collaboration.created',
      'collaboration.accepted',
      'collaboration.rejected',
      'collaboration.completed',
      'collaboration.cancelled',
      'collaboration.updated'
    ];
  }
}

module.exports = CollaborationObserver;
