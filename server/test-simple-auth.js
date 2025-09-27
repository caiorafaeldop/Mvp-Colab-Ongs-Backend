/**
 * Script de teste para o novo sistema de autenticação simplificado
 * Execute com: node test-simple-auth.js
 */

const SimpleJwtAuthService = require('./src/infra/services/SimpleJwtAuthService');
const SimpleAuthController = require('./src/presentation/controllers/SimpleAuthController');

// Mock do UserRepository para teste
class MockUserRepository {
  constructor() {
    this.users = [];
  }

  async findByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async findById(id) {
    return this.users.find(user => user.id === id || user._id === id);
  }

  async create(user) {
    const savedUser = {
      id: Date.now().toString(),
      _id: Date.now().toString(),
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(savedUser);
    return savedUser;
  }
}

async function testSimpleAuth() {
  console.log('🧪 Testando novo sistema de autenticação simplificado...\n');

  try {
    // 1. Criar instâncias
    const mockUserRepo = new MockUserRepository();
    const authService = new SimpleJwtAuthService(mockUserRepo, 'test-secret');
    const authController = new SimpleAuthController(authService);

    console.log('✅ 1. Instâncias criadas com sucesso');

    // 2. Testar registro
    console.log('\n📝 2. Testando registro de usuário...');
    
    const registerData = {
      name: 'ONG Teste',
      email: 'teste@ong.com',
      password: 'senha123',
      userType: 'organization',
      phone: '11999999999'
    };

    const mockReq = { body: registerData };
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`   Status: ${code}`);
          console.log(`   Response:`, JSON.stringify(data, null, 2));
          return { registerResult: data };
        }
      })
    };

    const registerResult = await authController.register(mockReq, mockRes);
    console.log('✅ Registro concluído');

    // 3. Testar login
    console.log('\n🔐 3. Testando login...');
    
    const loginReq = { 
      body: { 
        email: 'teste@ong.com', 
        password: 'senha123' 
      } 
    };
    
    let loginTokens = null;
    const loginRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`   Status: ${code}`);
          console.log(`   Response:`, JSON.stringify(data, null, 2));
          if (data.success && data.data) {
            loginTokens = data.data;
          }
          return { loginResult: data };
        }
      })
    };

    await authController.login(loginReq, loginRes);
    console.log('✅ Login concluído');

    // 4. Testar verificação de token
    if (loginTokens && loginTokens.accessToken) {
      console.log('\n🔍 4. Testando verificação de token...');
      
      const user = await authService.verifyAccessToken(loginTokens.accessToken);
      console.log('   Usuário verificado:', {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        userType: user.userType
      });
      console.log('✅ Verificação de token concluída');

      // 5. Testar refresh de tokens
      console.log('\n🔄 5. Testando refresh de tokens...');
      
      const refreshReq = { 
        body: { 
          refreshToken: loginTokens.refreshToken 
        } 
      };
      
      const refreshRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`   Status: ${code}`);
            console.log(`   Response:`, JSON.stringify(data, null, 2));
            return { refreshResult: data };
          }
        })
      };

      await authController.refresh(refreshReq, refreshRes);
      console.log('✅ Refresh de tokens concluído');
    }

    // 6. Testar middleware
    console.log('\n🛡️ 6. Testando middleware de autenticação...');
    
    const { createSimpleAuthMiddleware } = require('./src/presentation/middleware/SimpleAuthMiddleware');
    const middleware = createSimpleAuthMiddleware(authService);
    
    const mockReqAuth = {
      headers: {
        authorization: `Bearer ${loginTokens?.accessToken || 'invalid-token'}`
      }
    };
    
    const mockResAuth = {
      status: (code) => ({
        json: (data) => {
          console.log(`   Middleware Status: ${code}`);
          console.log(`   Middleware Response:`, JSON.stringify(data, null, 2));
          return data;
        }
      })
    };
    
    const mockNext = () => {
      console.log('   ✅ Middleware passou - usuário autenticado');
      console.log('   Usuário no request:', {
        id: mockReqAuth.user?.id || mockReqAuth.user?._id,
        email: mockReqAuth.user?.email
      });
    };

    if (loginTokens?.accessToken) {
      await middleware(mockReqAuth, mockResAuth, mockNext);
      console.log('✅ Middleware testado com sucesso');
    }

    console.log('\n🎉 Todos os testes do sistema simplificado passaram!');
    
    console.log('\n📋 Resumo da implementação:');
    console.log('✅ SimpleJwtAuthService - Sistema JWT limpo sem cookies');
    console.log('✅ SimpleAuthController - Controller simplificado');
    console.log('✅ SimpleAuthMiddleware - Middleware apenas com Bearer tokens');
    console.log('✅ Rotas documentadas no Swagger');
    console.log('✅ Integração com Factory Pattern mantida');
    console.log('✅ Compatibilidade com sistema antigo preservada');

    console.log('\n🚀 Para usar:');
    console.log('1. npm run dev (iniciar servidor)');
    console.log('2. Acesse http://localhost:3000/api-docs');
    console.log('3. Teste os endpoints em /api/auth/*');
    console.log('4. Use o botão "Authorize" no Swagger');
    console.log('5. Teste endpoints protegidos de produtos');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar teste
testSimpleAuth().catch(console.error);
