/**
 * TESTE SIMPLES DOS TEMPLATES
 * Execute: node scripts/test-templates.js
 */

const { TemplateFactory } = require('../src/application/templates');

async function testarTemplates() {
  console.log('🧪 TESTANDO TEMPLATES');
  console.log('====================');
  
  try {
    // 1. Testar se a factory funciona
    console.log('\n1. Testando TemplateFactory...');
    const templatesDisponiveis = TemplateFactory.getAvailableTemplates();
    console.log('✅ Templates disponíveis:', templatesDisponiveis);
    
    // 2. Testar criação de template
    console.log('\n2. Testando criação de template...');
    const uploadTemplate = TemplateFactory.create('upload', {
      allowedTypes: ['image/jpeg', 'image/png'],
      maxSize: 5 * 1024 * 1024
    });
    console.log('✅ Template de upload criado:', uploadTemplate.name);
    
    // 3. Testar template de autenticação (sem executar)
    console.log('\n3. Testando template de autenticação...');
    const loginTemplate = TemplateFactory.create('login', {});
    console.log('✅ Template de login criado:', loginTemplate.name);
    
    // 4. Testar template de doação
    console.log('\n4. Testando template de doação...');
    const donationTemplate = TemplateFactory.create('single-donation', {});
    console.log('✅ Template de doação criado:', donationTemplate.name);
    
    console.log('\n🎉 TODOS OS TEMPLATES FUNCIONANDO!');
    console.log('Agora você pode usar nos seus services.');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testarTemplates();
