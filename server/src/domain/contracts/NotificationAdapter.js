/**
 * NotificationAdapter contract (placeholder)
 * Implement providers like Email, WhatsApp, etc.
 */
class NotificationAdapter {
  async send(message, options = {}) {
    throw new Error('Method send must be implemented by concrete adapter');
  }
  getProviderName() {
    throw new Error('Method getProviderName must be implemented by concrete adapter');
  }
}

module.exports = NotificationAdapter;
