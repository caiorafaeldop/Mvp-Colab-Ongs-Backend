/**
 * Configuração do Jest para testes do projeto
 * @type {import('jest').Config}
 */

module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',

  // Diretórios onde procurar testes
  roots: ['<rootDir>/tests'],

  // Padrão de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**',
    '!src/main/server.js' // Excluir arquivo principal
  ],

  // Diretório de saída da cobertura
  coverageDirectory: 'coverage',

  // Reporters de cobertura
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // Timeout para testes assíncronos (5 segundos)
  testTimeout: 5000,
  
  // Forçar exit após testes
  forceExit: true,
  
  // Detectar handles abertos
  detectOpenHandles: false,

  // Limpar mocks automaticamente entre testes
  clearMocks: true,

  // Restaurar mocks automaticamente entre testes
  restoreMocks: true,

  // Resetar módulos entre testes
  resetModules: true,

  // Verbose output
  verbose: true,

  // Setup files (executado antes de cada teste)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Transformações (não usar para ES6, usar CommonJS)
  transform: {},

  // Ignorar node_modules
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],

  // Thresholds de cobertura (opcional)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
