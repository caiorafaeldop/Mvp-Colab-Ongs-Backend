/**
 * Script de teste automatizado para o sistema de autenticação
 *
 * Uso:
 *   node scripts/test-authentication.js
 *
 * Testa:
 * - Envio de código de verificação
 * - Verificação de código
 * - Recuperação de senha
 * - Rate limiting
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `teste-${Date.now()}@exemplo.com`;

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Testes
async function testSendVerificationCode() {
  log('\n📧 Teste 1: Enviar código de verificação', 'blue');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/verify-email/send`, {
      email: TEST_EMAIL,
    });

    if (response.data.success) {
      logSuccess('Código enviado com sucesso');

      if (response.data.data.previewUrl) {
        logInfo(`Preview URL: ${response.data.data.previewUrl}`);
      }

      return true;
    } else {
      logError('Resposta não indica sucesso');
      return false;
    }
  } catch (error) {
    logError(`Erro: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testVerifyCode(code = '123456') {
  log('\n🔍 Teste 2: Verificar código', 'blue');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/verify-email/verify`, {
      email: TEST_EMAIL,
      code: code,
    });

    if (response.data.success) {
      logSuccess('Código verificado com sucesso');
      return true;
    } else {
      logError('Resposta não indica sucesso');
      return false;
    }
  } catch (error) {
    logError(`Erro: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testResendCode() {
  log('\n🔄 Teste 3: Reenviar código', 'blue');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/verify-email/resend`, {
      email: TEST_EMAIL,
    });

    if (response.data.success) {
      logSuccess('Código reenviado com sucesso');
      return true;
    } else {
      logError('Resposta não indica sucesso');
      return false;
    }
  } catch (error) {
    logError(`Erro: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testRateLimiting() {
  log('\n⏱️  Teste 4: Rate Limiting (3 tentativas)', 'blue');

  const testEmail = `rate-limit-${Date.now()}@exemplo.com`;
  let successCount = 0;
  let rateLimitHit = false;

  for (let i = 1; i <= 4; i++) {
    try {
      await axios.post(`${BASE_URL}/api/auth/verify-email/send`, {
        email: testEmail,
      });
      successCount++;
      logInfo(`Tentativa ${i}: Sucesso`);
      await delay(100); // Pequeno delay entre requisições
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitHit = true;
        logInfo(`Tentativa ${i}: Rate limit atingido (esperado)`);
      } else {
        logError(`Tentativa ${i}: Erro inesperado - ${error.message}`);
      }
    }
  }

  if (successCount === 3 && rateLimitHit) {
    logSuccess('Rate limiting funcionando corretamente (3 sucessos, 1 bloqueado)');
    return true;
  } else {
    logWarning(`Rate limiting pode não estar funcionando corretamente (${successCount} sucessos)`);
    return false;
  }
}

async function testPasswordReset() {
  log('\n🔑 Teste 5: Recuperação de senha', 'blue');

  const testEmail = `password-reset-${Date.now()}@exemplo.com`;

  try {
    // Solicitar recuperação
    const requestResponse = await axios.post(`${BASE_URL}/api/auth/password-reset/request`, {
      email: testEmail,
    });

    if (!requestResponse.data.success) {
      logError('Falha ao solicitar recuperação');
      return false;
    }

    logInfo('Código de recuperação solicitado');

    // Tentar redefinir senha (vai falhar porque não temos o código real)
    try {
      await axios.post(`${BASE_URL}/api/auth/password-reset/reset`, {
        email: testEmail,
        code: '000000', // Código inválido
        newPassword: 'novaSenha123',
      });
      logWarning('Código inválido foi aceito (não deveria)');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Código inválido rejeitado corretamente');
        return true;
      } else {
        logError(`Erro inesperado: ${error.message}`);
        return false;
      }
    }
  } catch (error) {
    logError(`Erro: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testInvalidEmail() {
  log('\n📧 Teste 6: Email inválido', 'blue');

  try {
    await axios.post(`${BASE_URL}/api/auth/verify-email/send`, {
      email: 'email-invalido',
    });
    logError('Email inválido foi aceito (não deveria)');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Email inválido rejeitado corretamente');
      return true;
    } else {
      logWarning(`Erro inesperado: ${error.message}`);
      return false;
    }
  }
}

async function testServerConnection() {
  log('\n🔌 Teste 0: Conexão com servidor', 'blue');

  try {
    await axios.get(`${BASE_URL}/api/auth/profile`);
    logSuccess('Servidor está respondendo');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Servidor não está rodando!');
      logInfo('Inicie o servidor com: npm run dev');
      return false;
    }
    // Qualquer outra resposta significa que o servidor está rodando
    logSuccess('Servidor está respondendo');
    return true;
  }
}

// Executar todos os testes
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 TESTES DO SISTEMA DE AUTENTICAÇÃO', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  logInfo(`Email de teste: ${TEST_EMAIL}`);
  logInfo(`Base URL: ${BASE_URL}\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Teste de conexão
  const serverOk = await testServerConnection();
  if (!serverOk) {
    logError('\n❌ Servidor não está acessível. Abortando testes.');
    process.exit(1);
  }

  // Lista de testes
  const tests = [
    { name: 'Enviar código', fn: testSendVerificationCode },
    { name: 'Reenviar código', fn: testResendCode },
    { name: 'Rate limiting', fn: testRateLimiting },
    { name: 'Recuperação de senha', fn: testPasswordReset },
    { name: 'Email inválido', fn: testInvalidEmail },
  ];

  // Executar testes
  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    await delay(500); // Delay entre testes
  }

  // Resumo
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RESUMO DOS TESTES', 'cyan');
  log('='.repeat(60), 'cyan');

  log(`\nTotal de testes: ${results.total}`);
  logSuccess(`Passou: ${results.passed}`);

  if (results.failed > 0) {
    logError(`Falhou: ${results.failed}`);
  }

  const percentage = ((results.passed / results.total) * 100).toFixed(1);
  log(`\nTaxa de sucesso: ${percentage}%\n`);

  if (results.failed === 0) {
    logSuccess('🎉 TODOS OS TESTES PASSARAM!');
  } else {
    logWarning('⚠️  ALGUNS TESTES FALHARAM');
  }

  log('\n' + '='.repeat(60) + '\n', 'cyan');

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Executar
runAllTests().catch((error) => {
  logError(`\n❌ Erro fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
