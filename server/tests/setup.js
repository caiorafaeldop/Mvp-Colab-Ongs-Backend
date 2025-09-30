/**
 * Setup global para testes Jest
 * Executado antes de cada arquivo de teste
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.PORT = '3001'; // Porta diferente para testes

// Timeout global para testes assíncronos
jest.setTimeout(10000);

// Suprimir logs do console durante testes (opcional)
// Descomente se quiser testes mais limpos
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Hook global - executado antes de todos os testes
beforeAll(() => {
  console.log('🧪 Iniciando suite de testes...\n');
});

// Hook global - executado após todos os testes
afterAll(() => {
  console.log('\n✅ Suite de testes finalizada!');
});
