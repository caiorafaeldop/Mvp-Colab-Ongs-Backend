const ProductObserver = require('../../infra/observers/ProductObserver');
const UserObserver = require('../../infra/observers/UserObserver');
const DonationObserver = require('../../infra/observers/DonationObserver');
const SystemObserver = require('../../infra/observers/SystemObserver');
const { logger } = require('../../infra/logger');

/**
 * Factory para criação e registro de Observers
 * Centraliza a criação de todos os observers da aplicação
 */
class ObserverFactory {
  constructor() {
    this.observers = new Map();
    this.eventManager = null;
  }

  setEventManager(eventManager) {
    this.eventManager = eventManager;
    logger.info('[OBSERVER FACTORY] EventManager configurado');
  }

  createProductObserver() {
    if (!this.observers.has('ProductObserver')) {
      const observer = new ProductObserver();
      this.observers.set('ProductObserver', observer);
      logger.info('[OBSERVER FACTORY] ProductObserver criado');
    }
    return this.observers.get('ProductObserver');
  }

  createUserObserver() {
    if (!this.observers.has('UserObserver')) {
      const observer = new UserObserver();
      this.observers.set('UserObserver', observer);
      logger.info('[OBSERVER FACTORY] UserObserver criado');
    }
    return this.observers.get('UserObserver');
  }

  createDonationObserver() {
    if (!this.observers.has('DonationObserver')) {
      const observer = new DonationObserver();
      this.observers.set('DonationObserver', observer);
      logger.info('[OBSERVER FACTORY] DonationObserver criado');
    }
    return this.observers.get('DonationObserver');
  }

  createSystemObserver() {
    if (!this.observers.has('SystemObserver')) {
      const observer = new SystemObserver();
      this.observers.set('SystemObserver', observer);
      logger.info('[OBSERVER FACTORY] SystemObserver criado');
    }
    return this.observers.get('SystemObserver');
  }

  registerAllObservers() {
    if (!this.eventManager) {
      throw new Error('EventManager not configured');
    }

    const observers = [
      this.createProductObserver(),
      this.createUserObserver(),
      this.createDonationObserver(),
      this.createSystemObserver()
    ];

    observers.forEach(observer => {
      this.eventManager.addObserver(observer);
    });

    logger.info('[OBSERVER FACTORY] Todos os observers registrados');
    return observers;
  }

  getCreatedObservers() {
    return Array.from(this.observers.keys());
  }
}

module.exports = ObserverFactory;
