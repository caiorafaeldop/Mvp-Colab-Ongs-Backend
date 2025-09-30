const IObserver = require('../../domain/observers/IObserver');
const { logger } = require('../logger');

/**
 * Observer para eventos relacionados a usuários
 * Monitora registro, login, atualização de perfil e ações de usuário
 */
class UserObserver extends IObserver {
  constructor() {
    super();
    this.name = 'UserObserver';
    this.eventTypes = [
      'user.registered',
      'user.login',
      'user.logout',
      'user.profile.updated',
      'user.password.changed',
      'user.deleted'
    ];
  }

  async update(event, context) {
    try {
      logger.info(`[${this.name}] Processando evento: ${event.type}`, {
        eventId: event.id,
        userId: event.data?.userId,
        timestamp: event.timestamp
      });

      switch (event.type) {
        case 'user.registered':
          await this.handleUserRegistered(event, context);
          break;
        case 'user.login':
          await this.handleUserLogin(event, context);
          break;
        case 'user.logout':
          await this.handleUserLogout(event, context);
          break;
        case 'user.profile.updated':
          await this.handleProfileUpdated(event, context);
          break;
        case 'user.password.changed':
          await this.handlePasswordChanged(event, context);
          break;
        case 'user.deleted':
          await this.handleUserDeleted(event, context);
          break;
        default:
          logger.warn(`[${this.name}] Tipo de evento não tratado: ${event.type}`);
      }
    } catch (error) {
      logger.error(`[${this.name}] Erro ao processar evento`, {
        error: error.message,
        eventType: event.type,
        eventId: event.id
      });
    }
  }

  shouldHandle(event) {
    return this.eventTypes.includes(event.type);
  }

  getName() {
    return this.name;
  }

  getEventTypes() {
    return this.eventTypes;
  }

  // Handlers específicos
  async handleUserRegistered(event, context) {
    logger.info(`[${this.name}] Novo usuário registrado`, {
      userId: event.data.userId,
      email: event.data.email,
      userType: event.data.userType
    });

    // Lógica adicional:
    // - Enviar email de boas-vindas
    // - Criar perfil inicial
    // - Registrar em analytics
    // - Enviar para CRM
  }

  async handleUserLogin(event, context) {
    logger.info(`[${this.name}] Usuário fez login`, {
      userId: event.data.userId,
      email: event.data.email,
      ip: context.ip,
      userAgent: context.userAgent
    });

    // Lógica adicional:
    // - Registrar última atividade
    // - Verificar login suspeito
    // - Atualizar estatísticas
  }

  async handleUserLogout(event, context) {
    logger.info(`[${this.name}] Usuário fez logout`, {
      userId: event.data.userId
    });

    // Lógica adicional:
    // - Limpar sessões
    // - Registrar tempo de uso
  }

  async handleProfileUpdated(event, context) {
    logger.info(`[${this.name}] Perfil atualizado`, {
      userId: event.data.userId,
      fields: event.data.updatedFields
    });

    // Lógica adicional:
    // - Invalidar cache
    // - Sincronizar com outros sistemas
  }

  async handlePasswordChanged(event, context) {
    logger.info(`[${this.name}] Senha alterada`, {
      userId: event.data.userId
    });

    // Lógica adicional:
    // - Enviar email de notificação
    // - Invalidar todos os tokens
    // - Registrar em log de segurança
  }

  async handleUserDeleted(event, context) {
    logger.info(`[${this.name}] Usuário deletado`, {
      userId: event.data.userId
    });

    // Lógica adicional:
    // - Limpar dados relacionados
    // - Arquivar informações
    // - Notificar sistemas externos
  }
}

module.exports = UserObserver;
