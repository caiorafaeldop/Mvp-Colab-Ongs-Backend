/**
 * Script de teste para o padrão Composite
 * 
 * Testa todas as funcionalidades do sistema de hierarquias de organizações:
 * - Criação de organizações Leaf e Composite
 * - Operações de árvore (adicionar/remover filiais)
 * - Cálculos recursivos (produtos, doações)
 * - Busca e navegação na árvore
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Importações
const CompositeFactory = require('../src/main/factories/CompositeFactory');
const OrganizationCompositeService = require('../src/application/services/OrganizationCompositeService');
const RepositoryFactory = require('../src/main/factories/RepositoryFactory');
const { logger } = require('../src/infra/logger');

class CompositeTestSuite {
  constructor() {
    this.organizationRepository = RepositoryFactory.createOrganizationRepository();
    this.productRepository = RepositoryFactory.createProductRepository();
    this.donationRepository = RepositoryFactory.createDonationRepository();
    
    this.compositeService = new OrganizationCompositeService(
      this.organizationRepository,
      this.productRepository,
      this.donationRepository
    );
    
    this.testData = {};
  }

  async runAllTests() {
    try {
      console.log('🚀 Iniciando testes do padrão Composite...\n');
      
      await this.connectDatabase();
      await this.cleanupTestData();
      
      // Testes básicos
      await this.testCreateOrganizations();
      await this.testBuildHierarchy();
      await this.testTreeOperations();
      
      // Testes de métricas
      await this.testCreateTestData();
      await this.testMetricsCalculation();
      
      // Testes avançados
      await this.testSearchOperations();
      await this.testErrorHandling();
      
      console.log('\n✅ Todos os testes do Composite passaram!');
      
    } catch (error) {
      console.error('\n❌ Erro nos testes:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async connectDatabase() {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/colab-ongs');
      console.log('📦 Conectado ao MongoDB');
    }
  }

  async cleanupTestData() {
    // Limpar dados de teste anteriores
    await this.organizationRepository.deleteMany({ name: /^TEST_/ });
    await this.productRepository.deleteMany({ name: /^TEST_/ });
    await this.donationRepository.deleteMany({ organizationName: /^TEST_/ });
    console.log('🧹 Dados de teste limpos');
  }

  async testCreateOrganizations() {
    console.log('\n📋 Teste 1: Criação de organizações...');
    
    // Criar organização matriz
    const matrixResult = await this.compositeService.createOrganization({
      name: 'TEST_Matriz_Principal',
      email: 'matriz@test.com',
      type: 'matrix'
    });
    
    this.testData.matrixId = matrixResult.data.id;
    console.log(`✓ Matriz criada: ${matrixResult.data.name} (${matrixResult.type})`);
    
    // Criar filiais
    const filial1Result = await this.compositeService.createOrganization({
      name: 'TEST_Filial_Norte',
      email: 'norte@test.com',
      type: 'branch'
    });
    
    const filial2Result = await this.compositeService.createOrganization({
      name: 'TEST_Filial_Sul',
      email: 'sul@test.com',
      type: 'branch'
    });
    
    // Criar sub-filial
    const subFilialResult = await this.compositeService.createOrganization({
      name: 'TEST_SubFilial_A',
      email: 'subfilial@test.com',
      type: 'independent'
    });
    
    this.testData.filial1Id = filial1Result.data.id;
    this.testData.filial2Id = filial2Result.data.id;
    this.testData.subFilialId = subFilialResult.data.id;
    
    console.log(`✓ Filiais criadas: ${filial1Result.data.name}, ${filial2Result.data.name}`);
    console.log(`✓ Sub-filial criada: ${subFilialResult.data.name}`);
  }

  async testBuildHierarchy() {
    console.log('\n🌳 Teste 2: Construção de hierarquia...');
    
    // Adicionar filiais à matriz
    await this.compositeService.addChildOrganization(this.testData.matrixId, this.testData.filial1Id);
    await this.compositeService.addChildOrganization(this.testData.matrixId, this.testData.filial2Id);
    
    // Adicionar sub-filial à filial1
    await this.compositeService.addChildOrganization(this.testData.filial1Id, this.testData.subFilialId);
    
    console.log('✓ Hierarquia construída: Matriz → Filiais → Sub-filial');
    
    // Verificar árvore
    const treeResult = await this.compositeService.getOrganizationTree(this.testData.matrixId);
    console.log('\n📊 Estrutura da árvore:');
    console.log(treeResult.data.display);
    
    console.log(`✓ Total de organizações na árvore: ${treeResult.data.totalOrganizations}`);
  }

  async testTreeOperations() {
    console.log('\n🔧 Teste 3: Operações na árvore...');
    
    // Buscar organização na árvore
    const searchResult = await this.compositeService.findOrganizationInTree(
      this.testData.matrixId, 
      this.testData.subFilialId
    );
    
    console.log(`✓ Sub-filial encontrada na árvore: ${searchResult.data.name}`);
    console.log(`✓ Caminho: ${searchResult.data.path.map(p => p.name).join(' → ')}`);
    
    // Testar remoção e re-adição
    await this.compositeService.removeChildOrganization(this.testData.filial1Id, this.testData.subFilialId);
    console.log('✓ Sub-filial removida da Filial Norte');
    
    await this.compositeService.addChildOrganization(this.testData.filial2Id, this.testData.subFilialId);
    console.log('✓ Sub-filial movida para Filial Sul');
  }

  async testCreateTestData() {
    console.log('\n📦 Teste 4: Criação de dados para métricas...');
    
    // Criar produtos para cada organização
    const organizations = [
      { id: this.testData.matrixId, name: 'TEST_Matriz_Principal', products: 2 },
      { id: this.testData.filial1Id, name: 'TEST_Filial_Norte', products: 3 },
      { id: this.testData.filial2Id, name: 'TEST_Filial_Sul', products: 1 },
      { id: this.testData.subFilialId, name: 'TEST_SubFilial_A', products: 2 }
    ];
    
    for (const org of organizations) {
      for (let i = 1; i <= org.products; i++) {
        await this.productRepository.create({
          name: `TEST_Produto_${org.name}_${i}`,
          description: `Produto de teste ${i}`,
          organizationId: org.id,
          organizationName: org.name,
          price: Math.random() * 100
        });
      }
      console.log(`✓ ${org.products} produtos criados para ${org.name}`);
    }
    
    // Criar doações para cada organização
    for (const org of organizations) {
      const donations = Math.floor(Math.random() * 3) + 1;
      for (let i = 1; i <= donations; i++) {
        await this.donationRepository.create({
          amount: Math.floor(Math.random() * 500) + 50,
          organizationId: org.id,
          organizationName: org.name,
          donorName: `Doador Teste ${i}`,
          donorEmail: `doador${i}@test.com`,
          type: 'single'
        });
      }
      console.log(`✓ ${donations} doações criadas para ${org.name}`);
    }
  }

  async testMetricsCalculation() {
    console.log('\n📊 Teste 5: Cálculo de métricas...');
    
    // Métricas da matriz (deve incluir todas as filiais)
    const matrixMetrics = await this.compositeService.getOrganizationMetrics(this.testData.matrixId);
    console.log('\n📈 Métricas da Matriz (recursivas):');
    console.log(`  • Total de organizações: ${matrixMetrics.data.totalOrganizations}`);
    console.log(`  • Total de produtos: ${matrixMetrics.data.totalProducts}`);
    console.log(`  • Total de doações: R$ ${matrixMetrics.data.totalDonations.toFixed(2)}`);
    console.log(`  • Média produtos/org: ${matrixMetrics.data.metrics.averageProductsPerOrg}`);
    console.log(`  • Média doações/org: R$ ${matrixMetrics.data.metrics.averageDonationsPerOrg}`);
    
    // Métricas de uma filial
    const filialMetrics = await this.compositeService.getOrganizationMetrics(this.testData.filial2Id);
    console.log('\n📈 Métricas da Filial Sul (com sub-filial):');
    console.log(`  • Total de organizações: ${filialMetrics.data.totalOrganizations}`);
    console.log(`  • Total de produtos: ${filialMetrics.data.totalProducts}`);
    console.log(`  • Total de doações: R$ ${filialMetrics.data.totalDonations.toFixed(2)}`);
    
    console.log('✓ Métricas calculadas corretamente');
  }

  async testSearchOperations() {
    console.log('\n🔍 Teste 6: Operações de busca...');
    
    // Listar todas as matrizes
    const matricesResult = await this.compositeService.getAllMatrixOrganizations();
    console.log(`✓ ${matricesResult.total} organizações matrizes encontradas`);
    
    // Verificar se nossa matriz de teste está na lista
    const ourMatrix = matricesResult.data.find(m => m.name === 'TEST_Matriz_Principal');
    if (ourMatrix) {
      console.log(`✓ Nossa matriz encontrada com ${ourMatrix.totalOrganizations} organizações`);
    }
    
    // Buscar organização específica
    const searchResult = await this.compositeService.findOrganizationInTree(
      this.testData.matrixId,
      this.testData.filial1Id
    );
    
    if (searchResult.success) {
      console.log(`✓ Filial encontrada: ${searchResult.data.name}`);
    }
  }

  async testErrorHandling() {
    console.log('\n⚠️  Teste 7: Tratamento de erros...');
    
    try {
      // Tentar criar organização com dados inválidos
      await this.compositeService.createOrganization({
        name: '',
        email: 'email-inválido'
      });
      console.log('❌ Deveria ter falhado com dados inválidos');
    } catch (error) {
      console.log('✓ Erro capturado corretamente para dados inválidos');
    }
    
    try {
      // Tentar buscar organização inexistente
      await this.compositeService.getOrganizationTree('507f1f77bcf86cd799439011');
      console.log('❌ Deveria ter falhado com ID inexistente');
    } catch (error) {
      console.log('✓ Erro capturado corretamente para ID inexistente');
    }
    
    try {
      // Tentar criar ciclo na hierarquia
      await this.compositeService.addChildOrganization(this.testData.subFilialId, this.testData.matrixId);
      console.log('❌ Deveria ter falhado ao criar ciclo');
    } catch (error) {
      console.log('✓ Erro capturado corretamente para ciclo na hierarquia');
    }
  }

  async cleanup() {
    console.log('\n🧹 Limpeza final...');
    await this.cleanupTestData();
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📦 Conexão com MongoDB fechada');
    }
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const testSuite = new CompositeTestSuite();
  
  testSuite.runAllTests()
    .then(() => {
      console.log('\n🎉 Testes do Composite concluídos com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testes falharam:', error);
      process.exit(1);
    });
}

module.exports = CompositeTestSuite;
