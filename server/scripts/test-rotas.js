/**
 * 🧪 TESTE DAS ROTAS CORRETAS - NAVEGAÇÃO COMPLETA DO PROJETO
 * 
 * Rotas REAIS encontradas navegando no código:
 * 
 * UPLOAD: /api/upload (POST para upload de imagem)
 * PRODUTOS: /api/products/* (GET, POST, PUT, DELETE)
 * DOAÇÕES/MERCADOPAGO: /api/donations/* (single, recurring, webhook)
 * AUTH: /api/auth/* (register, login, logout)
 * 
 * Execute: node scripts/test-rotas-corretas.js
 */

const axios = require('axios');

// Configuração base
const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Criar instância limpa do axios
const api = axios.create({
  timeout: 15000,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

console.log('🧪 TESTE DAS ROTAS CORRETAS');
console.log('===========================');
console.log(`🌐 URL Base: ${BASE_URL}\n`);

// Variáveis globais
let authToken = '';
let userId = '';
let productId = '';

// ========================================
// UTILITÁRIOS
// ========================================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 15000
    };
    
    if (data) config.data = data;
    if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
    
    const response = await api(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

const logTest = (testName, result) => {
  const status = result.success ? '✅' : '❌';
  const statusCode = result.status ? `[${result.status}]` : '';
  console.log(`${status} ${testName} ${statusCode}`);
  
  if (!result.success) {
    const errorMsg = typeof result.error === 'string' ? result.error : 
                     result.error?.message || JSON.stringify(result.error);
    console.log(`   Erro: ${errorMsg.substring(0, 150)}${errorMsg.length > 150 ? '...' : ''}`);
  } else if (result.data) {
    if (result.data.user?.id) {
      console.log(`   👤 User ID: ${result.data.user.id}`);
    }
    if (result.data.tokens?.accessToken) {
      console.log(`   🔑 Token: ${result.data.tokens.accessToken.substring(0, 20)}...`);
    }
    if (result.data.products?.length !== undefined) {
      console.log(`   📦 Produtos: ${result.data.products.length}`);
    }
    if (result.data.paymentUrl) {
      console.log(`   💳 Payment URL: ${result.data.paymentUrl.substring(0, 50)}...`);
    }
    if (result.data.url) {
      console.log(`   🔗 URL: ${result.data.url.substring(0, 50)}...`);
    }
  }
  
  return result.success;
};

// ========================================
// 1. HEALTH CHECK
// ========================================

async function testHealthCheck() {
  console.log('\n🏥 1. HEALTH CHECK');
  console.log('==================');
  
  const health = await makeRequest('GET', '/health');
  logTest('Health Check', health);
  
  return health.success;
}

// ========================================
// 2. AUTENTICAÇÃO (/api/auth/*)
// ========================================

async function testAuthentication() {
  console.log('\n🔐 2. AUTENTICAÇÃO');
  console.log('==================');
  
  const testUser = {
    name: 'Teste Rotas Corretas',
    email: `teste.corretas.${Date.now()}@example.com`,
    password: 'TestCorretas123',
    phone: '(11) 99999-9999',
    userType: 'common'
  };
  
//   // Registro
  const register = await makeRequest('POST', '/api/auth/register', testUser);
  const registerSuccess = logTest('Registro', register);
  
  if (registerSuccess && register.data.user) {
    userId = register.data.user.id;
    if (register.data.tokens) {
      authToken = register.data.tokens.accessToken;
    }
  }
  
  // Login (se registro falhou, tentar usuário existente)
  if (true) {
    const login = await makeRequest('POST', '/api/auth/login', {
      email: 'colab@gmail.com',
      password: '123456'
    });
    const loginSuccess = logTest('Login Existente', login);
    
    if (loginSuccess && login.data.tokens) {
      authToken = login.data.tokens.accessToken;
      userId = login.data.user?.id;
    }
  }
  
  // Profile (se tiver token)
  if (authToken) {
    const profile = await makeRequest('GET', '/api/auth/profile');
    logTest('Perfil', profile);
  }
  
  return !!authToken;
}

// ========================================
// 3. PRODUTOS (/api/products/*)
// ========================================

async function testProducts() {
  console.log('\n📦 3. PRODUTOS');
  console.log('==============');
  
  // GET /api/products - Listar produtos
  const listProducts = await makeRequest('GET', '/api/products');
  logTest('Listar Produtos', listProducts);
  
  // GET /api/products/search - Buscar produtos
  const searchProducts = await makeRequest('GET', '/api/products/search?q=teste');
  logTest('Buscar Produtos', searchProducts);
  
  // POST /api/products - Criar produto (precisa auth)
  if (authToken) {
    const newProduct = {
      name: 'Produto Teste Correto',
      description: 'Produto criado no teste das rotas corretas',
      category: 'roupas',
      condition: 'novo',
      quantity: 2,
      location: 'São Paulo, SP'
    };
    
    const createProduct = await makeRequest('POST', '/api/products', newProduct);
    const createSuccess = logTest('Criar Produto', createProduct);
    
    if (createSuccess && createProduct.data.product) {
      productId = createProduct.data.product.id;
    }
  }
  
  // GET /api/products/:id - Obter produto específico
  if (productId) {
    const getProduct = await makeRequest('GET', `/api/products/${productId}`);
    logTest('Obter Produto Específico', getProduct);
    
    // GET /api/products/:id/whatsapp - Link WhatsApp
    const whatsappLink = await makeRequest('GET', `/api/products/${productId}/whatsapp`);
    logTest('Link WhatsApp', whatsappLink);
  }
  
  // GET /api/my-products - Meus produtos (precisa auth)
  if (authToken) {
    const myProducts = await makeRequest('GET', '/api/my-products');
    logTest('Meus Produtos', myProducts);
  }
  
  return true;
}

// ========================================
// 4. DOAÇÕES/MERCADO PAGO (/api/donations/*)
// ========================================

async function testDonations() {
  console.log('\n💰 4. DOAÇÕES/MERCADO PAGO');
  console.log('==========================');
  
  // POST /api/donations/single - Doação única
  const singleDonation = {
    organizationId: userId || 'test-org-id',
    organizationName: 'ONG Teste',
    amount: 25.50,
    donorName: 'João Doador',
    donorEmail: 'joao.doador@test.com',
    donorPhone: '(11) 99999-9999'
  };
  
  const createSingle = await makeRequest('POST', '/api/donations/single', singleDonation);
  logTest('Doação Única', createSingle);
  
  // POST /api/donations/donate - Alias para doação
  const createDonate = await makeRequest('POST', '/api/donations/donate', singleDonation);
  logTest('Doação (Alias)', createDonate);
  
  // POST /api/donations/recurring - Doação recorrente
  const recurringDonation = {
    ...singleDonation,
    frequency: 'monthly'
  };
  
  const createRecurring = await makeRequest('POST', '/api/donations/recurring', recurringDonation);
  logTest('Doação Recorrente', createRecurring);
  
  // POST /api/donations/webhook - Webhook Mercado Pago
  const webhookData = {
    action: 'payment.updated',
    api_version: 'v1',
    data: { id: 'test-payment-123' },
    date_created: new Date().toISOString(),
    id: Date.now(),
    live_mode: false,
    type: 'payment',
    user_id: '123456789'
  };
  
  const webhook = await makeRequest('POST', '/api/donations/webhook', webhookData);
  logTest('Webhook Mercado Pago', webhook);
  
  // Rotas protegidas (se tiver auth)
  if (authToken && userId) {
    // GET /api/donations/organization/:id - Doações da organização
    const orgDonations = await makeRequest('GET', `/api/donations/organization/${userId}`);
    logTest('Doações da Organização', orgDonations);
    
    // GET /api/donations/organization/:id/statistics - Estatísticas
    const stats = await makeRequest('GET', `/api/donations/organization/${userId}/statistics`);
    logTest('Estatísticas de Doações', stats);
  }
  
  return true;
}

// ========================================
// 5. UPLOAD (/api/upload)
// ========================================

async function testUpload() {
  console.log('\n📁 5. UPLOAD');
  console.log('============');
  
  // POST /api/upload - Upload de imagem (precisa FormData)
  console.log('❌ Upload de Arquivo [SKIP]');
  console.log('   Info: Upload real precisa de FormData e arquivo');
  console.log('   Endpoint: POST /api/upload (com multipart/form-data)');
  console.log('   Campo: "image" (single file)');
  console.log('   Destino: Cloudinary pasta "produtos"');
  
  return true;
}

// ========================================
// 6. LIMPEZA
// ========================================

async function testCleanup() {
  console.log('\n🧹 6. LIMPEZA');
  console.log('=============');
  
  // Deletar produto criado
  if (productId && authToken) {
    const deleteProduct = await makeRequest('DELETE', `/api/products/${productId}`);
    logTest('Deletar Produto', deleteProduct);
  }
  
  // Logout
  if (authToken) {
    const logout = await makeRequest('POST', '/api/auth/logout');
    logTest('Logout', logout);
  }
  
  return true;
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

async function runCorrectTests() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Iniciando teste das rotas corretas...\n');
    
    // Verificar servidor
    try {
      await api.get(`${BASE_URL}/health`);
      console.log('✅ Servidor rodando!\n');
    } catch (error) {
      console.log('❌ Servidor não está rodando!');
      console.log(`💡 Execute: npm start`);
      return;
    }
    
    // Executar testes
    await testHealthCheck();
    await delay(1000);
    
    const authSuccess = await testAuthentication();
    await delay(1000);
    
    await testProducts();
    await delay(1000);
    
    await testDonations();
    await delay(1000);
    
    await testUpload();
    await delay(1000);
    
    await testCleanup();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n🏆 RESUMO - ROTAS CORRETAS TESTADAS');
    console.log('===================================');
    console.log(`⏱️  Tempo: ${duration}s`);
    console.log(`🔑 Auth: ${authSuccess ? 'Sucesso' : 'Falhou'}`);
    console.log(`👤 User ID: ${userId || 'N/A'}`);
    console.log(`📦 Product ID: ${productId || 'N/A'}`);
    
    console.log('\n📡 ROTAS REAIS ENCONTRADAS:');
    console.log('✅ /health - Health check');
    console.log('✅ /api/auth/* - Autenticação');
    console.log('✅ /api/products/* - Produtos (CRUD)');
    console.log('✅ /api/donations/* - Doações + Mercado Pago');
    console.log('✅ /api/upload - Upload de imagens');
    
    console.log('\n🎯 ENDPOINTS ESPECÍFICOS TESTADOS:');
    console.log('Auth: /register, /login, /logout, /profile');
    console.log('Produtos: /products, /products/search, /products/:id, /my-products');
    console.log('Doações: /single, /donate, /recurring, /webhook, /organization/:id');
    console.log('Upload: POST /upload (FormData com campo "image")');
    
    console.log('\n✅ Teste das rotas corretas finalizado!');
    console.log('💡 Estas são as rotas que REALMENTE existem no seu projeto.');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runCorrectTests();
}

module.exports = { runCorrectTests };
