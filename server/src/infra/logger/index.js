/**
 * Índice do sistema de logging
 * Exporta todas as funcionalidades de logging da aplicação
 */

const Logger = require('./Logger');
const LoggerFactory = require('./LoggerFactory');

// Instância singleton do logger principal
const logger = Logger.getInstance();

module.exports = {
  // Classes principais
  Logger,
  LoggerFactory,
  
  // Instância singleton (para uso direto)
  logger,
  
  // Shortcuts para criação rápida de loggers específicos
  createModuleLogger: LoggerFactory.createModuleLogger,
  createRequestLogger: LoggerFactory.createRequestLogger,
  createUseCaseLogger: LoggerFactory.createUseCaseLogger,
  createServiceLogger: LoggerFactory.createServiceLogger,
  createRepositoryLogger: LoggerFactory.createRepositoryLogger,
  createJobLogger: LoggerFactory.createJobLogger,
  createIntegrationLogger: LoggerFactory.createIntegrationLogger,
  
  // Middleware
  requestLoggingMiddleware: LoggerFactory.createRequestLoggingMiddleware(),
  
  // Utilitários
  getStats: LoggerFactory.getStats
};
