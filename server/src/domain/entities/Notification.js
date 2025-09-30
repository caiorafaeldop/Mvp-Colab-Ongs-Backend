class Notification {
  constructor(
    id,
    userId,
    title,
    message,
    type = 'info', // info, success, warning, error, collaboration, system
    isRead = false,
    createdAt = new Date(),
    readAt = null,
    relatedEntityId = null,
    relatedEntityType = null, // collaboration, user, product, file
    actionUrl = null,
    metadata = {}
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.message = message;
    this.type = type;
    this.isRead = isRead;
    this.createdAt = createdAt;
    this.readAt = readAt;
    this.relatedEntityId = relatedEntityId;
    this.relatedEntityType = relatedEntityType;
    this.actionUrl = actionUrl;
    this.metadata = metadata;
  }

  static create(userId, title, message, type = 'info') {
    return new Notification(null, userId, title, message, type);
  }

  static createCollaborationNotification(userId, title, message, collaborationId) {
    return new Notification(
      null,
      userId,
      title,
      message,
      'collaboration',
      false,
      new Date(),
      null,
      collaborationId,
      'collaboration'
    );
  }

  markAsRead() {
    this.isRead = true;
    this.readAt = new Date();
  }

  setRelatedEntity(entityId, entityType) {
    this.relatedEntityId = entityId;
    this.relatedEntityType = entityType;
  }

  setActionUrl(url) {
    this.actionUrl = url;
  }

  addMetadata(key, value) {
    this.metadata[key] = value;
  }

  isUnread() {
    return !this.isRead;
  }

  isCollaborationNotification() {
    return this.type === 'collaboration';
  }

  getTimeAgo() {
    const now = new Date();
    const diffMs = now - this.createdAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Agora';
    }
    if (diffMins < 60) {
      return `${diffMins}m atrás`;
    }
    if (diffHours < 24) {
      return `${diffHours}h atrás`;
    }
    return `${diffDays}d atrás`;
  }
}

module.exports = Notification;
