/**
 * DEBUG DA VALIDAÇÃO DE SENHA
 * Vamos descobrir exatamente o que está acontecendo
 */

console.log('🔍 DEBUG DA VALIDAÇÃO DE SENHA');
console.log('==============================\n');

// Testar a regex diretamente
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const senha = 'MinhaSenh@123';

console.log('📋 TESTE DIRETO DA REGEX:');
console.log('Senha:', senha);
console.log('Regex:', regex);
console.log('Resultado:', regex.test(senha));

// Quebrar a regex em partes
console.log('\n🔍 ANÁLISE DETALHADA:');
console.log('Tem minúscula?', /(?=.*[a-z])/.test(senha));
console.log('Tem maiúscula?', /(?=.*[A-Z])/.test(senha));
console.log('Tem número?', /(?=.*\d)/.test(senha));
console.log('Tem conteúdo?', /.+$/.test(senha));

// Testar com Zod
console.log('\n📦 TESTE COM ZOD:');
try {
  const { z } = require('zod');
  
  const passwordSchema = z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula e 1 número');
  
  const resultado = passwordSchema.safeParse(senha);
  
  if (resultado.success) {
    console.log('✅ Zod: Senha VÁLIDA');
  } else {
    console.log('❌ Zod: Senha INVÁLIDA');
    console.log('Erros:', resultado.error.errors);
  }
  
} catch (error) {
  console.error('Erro no teste Zod:', error.message);
}

// Testar com o DTO real
console.log('\n🎯 TESTE COM DTO REAL:');
try {
  const { CreateUserDTO } = require('./src/application/dtos');
  
  const userData = new CreateUserDTO({
    name: 'João Silva',
    email: 'joao@example.com',
    password: senha,
    organizationType: 'ong'
  });
  
  console.log('✅ DTO: Senha ACEITA');
  console.log('Email:', userData.getEmail());
  
} catch (error) {
  console.log('❌ DTO: Senha REJEITADA');
  console.log('Erro:', error.message);
  if (error.errors) {
    console.log('Detalhes:', error.errors.map(e => ({
      path: e.path,
      message: e.message,
      received: e.received
    })));
  }
}

// Testar outras senhas
console.log('\n🧪 TESTE DE OUTRAS SENHAS:');
const senhas = [
  'Password1',
  'Teste123',
  'AbC123def',
  'MinhaSenh@123',
  'Senha1234',
  'Test@123'
];

senhas.forEach(s => {
  const valida = regex.test(s);
  console.log(`${valida ? '✅' : '❌'} "${s}" - ${valida ? 'VÁLIDA' : 'INVÁLIDA'}`);
});
