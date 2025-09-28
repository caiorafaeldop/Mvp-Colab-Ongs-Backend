const IObserver = require('../../domain/observers/IObserver');

/**
 * Observer para eventos de atividade do usuário
 * Monitora ações dos usuários e gera insights sobre engajamento
 */
class UserActivityObserver extends IObserver {
  constructor(notificationRepository, userRepository) {
    super();
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.name = 'UserActivityObserver';
    this.activityThresholds = {
      inactive_days: 7,
      low_activity_days: 14,
      high_activity_actions: 20
    };
  }

  /**
   * Processa eventos de atividade do usuário
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async update(event, context = {}) {
    try {
      switch (event.type) {
        case 'user.login':
          await this.handleUserLogin(event.data, context);
          break;
        case 'user.logout':
          await this.handleUserLogout(event.data, context);
          break;
        case 'user.profile_updated':
          await this.handleProfileUpdated(event.data, context);
          break;
        case 'user.inactive':
          await this.handleUserInactive(event.data, context);
          break;
        case 'user.first_login':
          await this.handleFirstLogin(event.data, context);
          break;
        case 'user.high_activity':
          await this.handleHighActivity(event.data, context);
          break;
        case 'user.search_performed':
          await this.handleSearchPerformed(event.data, context);
          break;
        default:
          console.log(`[UserActivityObserver] Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error(`[UserActivityObserver] Erro ao processar evento ${event.type}:`, error.message);
    }
  }

  /**
   * Trata evento de login do usuário
   * @param {Object} data - Dados do login
   * @param {Object} context - Contexto
   */
  async handleUserLogin(data, context) {
    const { userId, loginTime, isFirstLogin, daysSinceLastLogin } = data;

    console.log(`[UserActivityObserver] Login detectado: usuário ${userId}`);

    // Se é o primeiro login, dispara evento específico
    if (isFirstLogin) {
      await this.handleFirstLogin({ userId, loginTime }, context);
      return;
    }

    // Se ficou muito tempo inativo, envia boas-vindas de volta
    if (daysSinceLastLogin && daysSinceLastLogin > this.activityThresholds.inactive_days) {
      if (this.notificationRepository) {
        await this.notificationRepository.create({
          userId: userId,
          type: 'welcome_back',
          title: 'Bem-vindo de volta!',
          message: `Que bom ter você de volta! Veja as novas oportunidades de colaboração que surgiram.`,
          data: {
            daysSinceLastLogin: daysSinceLastLogin,
            suggestion: 'Confira seu perfil e veja se há atualizações necessárias'
          },
          priority: 'medium'
        });
      }
    }

    // Atualiza estatísticas de login
    await this.updateLoginStats(userId, loginTime);
  }

  /**
   * Trata evento de logout do usuário
   * @param {Object} data - Dados do logout
   * @param {Object} context - Contexto
   */
  async handleUserLogout(data, context) {
    const { userId, logoutTime, sessionDuration } = data;

    console.log(`[UserActivityObserver] Logout detectado: usuário ${userId}, sessão: ${sessionDuration}min`);

    // Log para métricas de engajamento
    console.log(`[UserActivityObserver] Métricas - Sessão de ${sessionDuration} minutos`);
  }

  /**
   * Trata primeiro login do usuário
   * @param {Object} data - Dados do primeiro login
   * @param {Object} context - Contexto
   */
  async handleFirstLogin(data, context) {
    const { userId, loginTime } = data;

    console.log(`[UserActivityObserver] Primeiro login: usuário ${userId}`);

    if (this.notificationRepository) {
      // Mensagem de boas-vindas
      await this.notificationRepository.create({
        userId: userId,
        type: 'welcome',
        title: 'Bem-vindo à Plataforma! 🎉',
        message: 'Complete seu perfil para encontrar as melhores oportunidades de colaboração.',
        data: {
          isFirstLogin: true,
          nextSteps: [
            'Complete informações da sua ONG',
            'Adicione causas e áreas de atuação',
            'Explore outras ONGs na plataforma'
          ]
        },
        priority: 'high'
      });

      // Dicas para novos usuários
      setTimeout(async () => {
        await this.notificationRepository.create({
          userId: userId,
          type: 'onboarding_tip',
          title: 'Dica: Complete seu perfil',
          message: 'ONGs com perfis completos têm 3x mais chances de encontrar colaborações.',
          data: {
            tip: 'profile_completion',
            benefit: 'Mais visibilidade e melhores matches'
          },
          priority: 'medium'
        });
      }, 5 * 60 * 1000); // 5 minutos após o primeiro login
    }
  }

  /**
   * Trata atualização de perfil
   * @param {Object} data - Dados da atualização
   * @param {Object} context - Contexto
   */
  async handleProfileUpdated(data, context) {
    const { userId, updatedFields, completionPercentage } = data;

    console.log(`[UserActivityObserver] Perfil atualizado: usuário ${userId}, ${completionPercentage}% completo`);

    if (this.notificationRepository) {
      // Parabeniza por melhorias no perfil
      if (completionPercentage >= 80) {
        await this.notificationRepository.create({
          userId: userId,
          type: 'profile_milestone',
          title: 'Perfil Quase Completo! 🌟',
          message: `Seu perfil está ${completionPercentage}% completo. Continue assim!`,
          data: {
            completionPercentage: completionPercentage,
            updatedFields: updatedFields,
            benefit: 'Perfis completos recebem mais propostas de colaboração'
          },
          priority: 'medium'
        });
      }

      // Incentiva a completar o perfil
      if (completionPercentage === 100) {
        await this.notificationRepository.create({
          userId: userId,
          type: 'profile_complete',
          title: 'Perfil Completo! ✅',
          message: 'Parabéns! Seu perfil está completo e otimizado para encontrar colaborações.',
          data: {
            achievement: 'profile_complete',
            nextStep: 'Agora você pode explorar outras ONGs e iniciar colaborações'
          },
          priority: 'high'
        });
      }
    }
  }

  /**
   * Trata usuário inativo
   * @param {Object} data - Dados da inatividade
   * @param {Object} context - Contexto
   */
  async handleUserInactive(data, context) {
    const { userId, daysSinceLastActivity, lastActivityType } = data;

    console.log(`[UserActivityObserver] Usuário inativo: ${userId}, ${daysSinceLastActivity} dias`);

    if (this.notificationRepository) {
      let message, priority;

      if (daysSinceLastActivity >= this.activityThresholds.low_activity_days) {
        message = 'Sentimos sua falta! Veja as novas oportunidades de colaboração disponíveis.';
        priority = 'high';
      } else if (daysSinceLastActivity >= this.activityThresholds.inactive_days) {
        message = 'Há novas ONGs na plataforma que podem interessar à sua organização.';
        priority = 'medium';
      }

      if (message) {
        await this.notificationRepository.create({
          userId: userId,
          type: 'reengagement',
          title: 'Novas Oportunidades Aguardando!',
          message: message,
          data: {
            daysSinceLastActivity: daysSinceLastActivity,
            lastActivityType: lastActivityType,
            incentive: 'Volte e descubra novas possibilidades de colaboração'
          },
          priority: priority
        });
      }
    }
  }

  /**
   * Trata alta atividade do usuário
   * @param {Object} data - Dados da alta atividade
   * @param {Object} context - Contexto
   */
  async handleHighActivity(data, context) {
    const { userId, actionsCount, timeframe } = data;

    console.log(`[UserActivityObserver] Alta atividade: usuário ${userId}, ${actionsCount} ações em ${timeframe}`);

    if (this.notificationRepository && actionsCount >= this.activityThresholds.high_activity_actions) {
      await this.notificationRepository.create({
        userId: userId,
        type: 'engagement_recognition',
        title: 'Usuário Ativo! 🚀',
        message: 'Você está muito ativo na plataforma! Continue explorando novas oportunidades.',
        data: {
          actionsCount: actionsCount,
          timeframe: timeframe,
          recognition: 'high_engagement',
          tip: 'Considere iniciar uma colaboração com as ONGs que você visitou'
        },
        priority: 'low'
      });
    }
  }

  /**
   * Trata busca realizada pelo usuário
   * @param {Object} data - Dados da busca
   * @param {Object} context - Contexto
   */
  async handleSearchPerformed(data, context) {
    const { userId, searchQuery, resultsCount, searchType } = data;

    console.log(`[UserActivityObserver] Busca realizada: usuário ${userId}, "${searchQuery}"`);

    // Se não encontrou resultados, sugere alternativas
    if (resultsCount === 0 && this.notificationRepository) {
      await this.notificationRepository.create({
        userId: userId,
        type: 'search_no_results',
        title: 'Nenhum resultado encontrado',
        message: 'Tente expandir sua busca ou usar termos diferentes.',
        data: {
          searchQuery: searchQuery,
          searchType: searchType,
          suggestions: [
            'Use termos mais gerais',
            'Verifique a ortografia',
            'Tente buscar por causa ou localização'
          ]
        },
        priority: 'low'
      });
    }

    // Log para métricas de busca
    console.log(`[UserActivityObserver] Métricas - Busca "${searchQuery}": ${resultsCount} resultados`);
  }

  /**
   * Atualiza estatísticas de login do usuário
   * @param {string} userId - ID do usuário
   * @param {Date} loginTime - Horário do login
   */
  async updateLoginStats(userId, loginTime) {
    try {
      if (this.userRepository) {
        // Aqui você pode implementar lógica para atualizar estatísticas
        // Por exemplo: último login, contagem de logins, etc.
        console.log(`[UserActivityObserver] Atualizando stats de login para usuário ${userId}`);
      }
    } catch (error) {
      console.error('[UserActivityObserver] Erro ao atualizar stats de login:', error.message);
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
      'user.login',
      'user.logout',
      'user.profile_updated',
      'user.inactive',
      'user.first_login',
      'user.high_activity',
      'user.search_performed'
    ];
  }
}

module.exports = UserActivityObserver;
