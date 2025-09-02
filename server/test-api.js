const axios = require("axios");

const API_BASE_URL = "http://localhost:3000/api";

// Função para testar a API
async function testAPI() {
  console.log("🚀 Iniciando testes da API...\n");

  try {
    // 1. Teste de Health Check
    console.log("1. Testando Health Check...");
    const healthResponse = await axios.get("http://localhost:3000/health");
    console.log("✅ Health Check:", healthResponse.data);
    console.log("");

    // 2. Registrar uma organização
    console.log("2. Registrando uma organização...");
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: "ONG Teste",
      email: "ong@teste.com",
      password: "senha123",
      userType: "organization",
      phone: "5511999999999",
    });
    console.log(
      "✅ Organização registrada:",
      registerResponse.data.data.user.name
    );
    const token = registerResponse.data.data.token;
    console.log("");

    // 3. Login
    console.log("3. Fazendo login...");
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: "ong@teste.com",
      password: "senha123",
    });
    console.log("✅ Login realizado com sucesso");
    console.log("");

    // 4. Criar um produto
    console.log("4. Criando um produto...");
    const createProductResponse = await axios.post(
      `${API_BASE_URL}/products`,
      {
        name: "Produto Teste",
        description: "Descrição do produto teste",
        price: 50.0,
        imageUrl: "https://example.com/image.jpg",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("✅ Produto criado:", createProductResponse.data.data.name);
    const productId = createProductResponse.data.data.id;
    console.log("");

    // 5. Listar produtos disponíveis
    console.log("5. Listando produtos disponíveis...");
    const productsResponse = await axios.get(`${API_BASE_URL}/products`);
    console.log("✅ Produtos encontrados:", productsResponse.data.data.length);
    console.log("");

    // 6. Buscar produtos
    console.log("6. Buscando produtos...");
    const searchResponse = await axios.get(
      `${API_BASE_URL}/products/search?q=teste`
    );
    console.log(
      "✅ Produtos encontrados na busca:",
      searchResponse.data.data.length
    );
    console.log("");

    // 7. Obter produto específico
    console.log("7. Obtendo produto específico...");
    const productResponse = await axios.get(
      `${API_BASE_URL}/products/${productId}`
    );
    console.log("✅ Produto obtido:", productResponse.data.data.name);
    console.log("");

    // 8. Gerar link do WhatsApp
    console.log("8. Gerando link do WhatsApp...");
    const whatsappResponse = await axios.get(
      `${API_BASE_URL}/products/${productId}/whatsapp?phone=5511999999999`
    );
    console.log(
      "✅ Link do WhatsApp gerado:",
      whatsappResponse.data.data.whatsappLink
    );
    console.log("");

    // 9. Listar produtos da organização
    console.log("9. Listando produtos da organização...");
    const myProductsResponse = await axios.get(`${API_BASE_URL}/my-products`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(
      "✅ Produtos da organização:",
      myProductsResponse.data.data.length
    );
    console.log("");

    // 10. Ativar/Desativar produto
    console.log("10. Alternando disponibilidade do produto...");
    const toggleResponse = await axios.patch(
      `${API_BASE_URL}/products/${productId}/toggle`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(
      "✅ Produto alternado:",
      toggleResponse.data.data.isAvailable ? "Ativado" : "Desativado"
    );
    console.log("");

    // 11. Atualizar produto
    console.log("11. Atualizando produto...");
    const updateResponse = await axios.put(
      `${API_BASE_URL}/products/${productId}`,
      {
        name: "Produto Atualizado",
        description: "Descrição atualizada",
        price: 75.0,
        imageUrl: "https://example.com/new-image.jpg",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("✅ Produto atualizado:", updateResponse.data.data.name);
    console.log("");

    // 12. Registrar usuário comum
    console.log("12. Registrando usuário comum...");
    const commonUserResponse = await axios.post(
      `${API_BASE_URL}/auth/register`,
      {
        name: "Usuário Comum",
        email: "usuario@teste.com",
        password: "senha123",
        userType: "common",
        phone: "5511888888888",
      }
    );
    console.log(
      "✅ Usuário comum registrado:",
      commonUserResponse.data.data.user.name
    );
    console.log("");

    console.log("🎉 Todos os testes foram executados com sucesso!");
    console.log("\n📋 Resumo dos testes:");
    console.log("- ✅ Health Check");
    console.log("- ✅ Registro de organização");
    console.log("- ✅ Login");
    console.log("- ✅ Criação de produto");
    console.log("- ✅ Listagem de produtos");
    console.log("- ✅ Busca de produtos");
    console.log("- ✅ Obtenção de produto específico");
    console.log("- ✅ Geração de link do WhatsApp");
    console.log("- ✅ Listagem de produtos da organização");
    console.log("- ✅ Alternância de disponibilidade");
    console.log("- ✅ Atualização de produto");
    console.log("- ✅ Registro de usuário comum");
  } catch (error) {
    console.error(
      "❌ Erro durante os testes:",
      error.response?.data || error.message
    );
  }
}

// Executar os testes se o arquivo for executado diretamente
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;

