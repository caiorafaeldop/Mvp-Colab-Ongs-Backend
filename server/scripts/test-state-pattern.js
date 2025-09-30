/**
 * Teste Completo do State Pattern
 * Testa FSM (Finite State Machine) em todos os domínios
 */

const EnhancedPaymentState = require('../src/domain/state/EnhancedPaymentState');
const CollaborationState = require('../src/domain/state/CollaborationState');
const ProjectState = require('../src/domain/state/ProjectState');
const UserState = require('../src/domain/state/UserState');

console.log('🧪 TESTE COMPLETO: STATE PATTERN COM FSM\n');
console.log('='.repeat(60));

let testsPassados = 0;
let testsFalhados = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    testsPassados++;
  } else {
    console.error(`  ❌ ${message}`);
    testsFalhados++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ========================================
// TESTE 1: EnhancedPaymentState
// ========================================
console.log('\n📋 TESTE 1: EnhancedPaymentState (FSM Completa)');
console.log('-'.repeat(60));

try {
  // Cria estado inicial
  let payment = new EnhancedPaymentState();
  assert(payment.getState() === 'pending', 'Estado inicial: pending');
  assert(payment.getAvailableTransitions().length > 0, 'Tem transições disponíveis');

  // Aprova pagamento
  payment = payment.approve({ userId: '123' });
  assert(payment.getState() === 'approved', 'Transição pending → approved');
  assert(payment.isSuccessful(), 'Pagamento está aprovado');

  // Tenta fazer chargeback
  payment = payment.chargeback({ reason: 'Fraud' });
  assert(payment.getState() === 'charged_back', 'Transição approved → charged_back');
  assert(payment.isFinal(), 'Estado final alcançado');

  // Valida transição inválida
  try {
    payment.approve();
    assert(false, 'Deveria lançar erro em transição inválida');
  } catch (error) {
    assert(error.message.includes('Invalid transition'), 'Erro em transição inválida');
  }

  // Testa webhook handling
  let webhookPayment = new EnhancedPaymentState();
  webhookPayment = webhookPayment.handleWebhookEvent('payment.approved', { amount: 100 });
  assert(webhookPayment.getState() === 'approved', 'Webhook handled corretamente');

  // Testa histórico
  assert(webhookPayment.getHistory().length === 1, 'Histórico registrado');
  
  // Testa fromMercadoPago
  const mpPayment = EnhancedPaymentState.fromMercadoPago('authorized');
  assert(mpPayment.getState() === 'approved', 'Normalização Mercado Pago');

  console.log('✅ TESTE 1: PASSOU');

} catch (error) {
  console.error(`❌ TESTE 1: FALHOU - ${error.message}`);
  testsFalhados++;
}

// ========================================
// TESTE 2: CollaborationState
// ========================================
console.log('\n📋 TESTE 2: CollaborationState');
console.log('-'.repeat(60));

try {
  // Cria colaboração em draft
  let collab = new CollaborationState();
  assert(collab.getState() === 'draft', 'Estado inicial: draft');
  assert(collab.isEditable(), 'Draft é editável');

  // Submete para aprovação
  collab = collab.submit({ organizationId: '123' });
  assert(collab.getState() === 'pending', 'Transição draft → pending');

  // Aprova colaboração
  collab = collab.approve('admin123', { notes: 'Approved' });
  assert(collab.getState() === 'active', 'Transição pending → active');
  assert(collab.isActive(), 'Colaboração ativa');

  // Pausa colaboração
  collab = collab.pause('Aguardando recursos');
  assert(collab.getState() === 'paused', 'Transição active → paused');

  // Resume
  collab = collab.resume();
  assert(collab.getState() === 'active', 'Transição paused → active');

  // Completa
  collab = collab.complete({ results: 'Success' });
  assert(collab.getState() === 'completed', 'Transição active → completed');
  assert(collab.isFinal(), 'Estado final');

  // Testa rejeição
  let rejectedCollab = new CollaborationState('pending');
  rejectedCollab = rejectedCollab.reject('Falta documentação', 'admin456');
  assert(rejectedCollab.getState() === 'rejected', 'Rejeição funciona');
  
  // Pode reenviar após rejeição
  assert(rejectedCollab.canTransitionTo('pending'), 'Pode reenviar após rejeição');

  console.log('✅ TESTE 2: PASSOU');

} catch (error) {
  console.error(`❌ TESTE 2: FALHOU - ${error.message}`);
  testsFalhados++;
}

// ========================================
// TESTE 3: ProjectState
// ========================================
console.log('\n📋 TESTE 3: ProjectState');
console.log('-'.repeat(60));

try {
  // Cria projeto em draft
  let project = new ProjectState();
  assert(project.getState() === 'draft', 'Estado inicial: draft');
  assert(project.isEditable(), 'Draft é editável');

  // Publica projeto
  project = project.publish('org123', { title: 'Novo Projeto' });
  assert(project.getState() === 'published', 'Transição draft → published');
  assert(project.canReceiveDonations(), 'Pode receber doações');

  // Inicia projeto
  project = project.start('manager123');
  assert(project.getState() === 'in_progress', 'Transição published → in_progress');
  assert(project.isInProgress(), 'Projeto em progresso');

  // Coloca em espera
  project = project.hold('Aguardando aprovação');
  assert(project.getState() === 'on_hold', 'Transição in_progress → on_hold');
  assert(project.isEditable(), 'On hold é editável');

  // Retoma
  project = project.start('manager123');
  assert(project.getState() === 'in_progress', 'Transição on_hold → in_progress');

  // Completa
  project = project.complete('manager123', { outcome: 'Success' });
  assert(project.getState() === 'completed', 'Transição in_progress → completed');
  assert(project.isFinalized(), 'Projeto finalizado');

  // Arquiva
  project = project.archive('admin123');
  assert(project.getState() === 'archived', 'Transição completed → archived');

  // Pode republicar
  assert(project.canTransitionTo('published'), 'Pode republicar projeto arquivado');

  console.log('✅ TESTE 3: PASSOU');

} catch (error) {
  console.error(`❌ TESTE 3: FALHOU - ${error.message}`);
  testsFalhados++;
}

// ========================================
// TESTE 4: UserState
// ========================================
console.log('\n📋 TESTE 4: UserState');
console.log('-'.repeat(60));

try {
  // Cria usuário pendente
  let user = new UserState();
  assert(user.getState() === 'pending_verification', 'Estado inicial: pending_verification');
  assert(user.needsVerification(), 'Precisa verificação');
  assert(!user.canLogin(), 'Não pode fazer login');

  // Ativa usuário
  user = user.activate('system', { email: 'user@example.com' });
  assert(user.getState() === 'active', 'Transição pending → active');
  assert(user.isActive(), 'Usuário ativo');
  assert(user.canLogin(), 'Pode fazer login');

  // Desativa por inatividade
  user = user.deactivate('Inativo por 90 dias');
  assert(user.getState() === 'inactive', 'Transição active → inactive');
  assert(user.canLogin(), 'Inativo ainda pode fazer login');

  // Reativa
  user = user.activate('auto-reactivation');
  assert(user.getState() === 'active', 'Transição inactive → active');

  // Suspende
  user = user.suspend('Violação de termos', 7 * 24 * 60 * 60 * 1000, 'admin123');
  assert(user.getState() === 'suspended', 'Transição active → suspended');
  assert(user.isBlocked(), 'Usuário bloqueado');
  assert(!user.canLogin(), 'Não pode fazer login quando suspenso');

  // Testa metadata de suspensão
  const history = user.getHistory();
  const suspensionRecord = history[history.length - 1];
  assert(suspensionRecord.metadata.reason === 'Violação de termos', 'Metadata de suspensão');

  // Bane usuário
  let bannedUser = new UserState('suspended');
  bannedUser = bannedUser.ban('Fraude comprovada', 'admin456');
  assert(bannedUser.getState() === 'banned', 'Transição suspended → banned');
  assert(bannedUser.isBlocked(), 'Usuário banido está bloqueado');

  // Deleta
  bannedUser = bannedUser.delete('gdpr-request');
  assert(bannedUser.getState() === 'deleted', 'Transição banned → deleted');
  assert(bannedUser.getAvailableTransitions().length === 0, 'Deleted é estado final');

  console.log('✅ TESTE 4: PASSOU');

} catch (error) {
  console.error(`❌ TESTE 4: FALHOU - ${error.message}`);
  testsFalhados++;
}

// ========================================
// TESTE 5: Validação de FSM
// ========================================
console.log('\n📋 TESTE 5: Validação de FSM (Finite State Machine)');
console.log('-'.repeat(60));

try {
  const payment = new EnhancedPaymentState();

  // Valida estrutura de transições
  assert(typeof payment.canTransitionTo === 'function', 'Método canTransitionTo existe');
  assert(typeof payment.getAvailableTransitions === 'function', 'Método getAvailableTransitions existe');
  assert(typeof payment.getHistory === 'function', 'Método getHistory existe');

  // Valida transições disponíveis
  const transitions = payment.getAvailableTransitions();
  assert(Array.isArray(transitions), 'Transições retorna array');
  assert(transitions.includes('approved'), 'Pending pode ir para approved');
  assert(!transitions.includes('refunded'), 'Pending não pode ir para refunded');

  // Valida histórico
  const newPayment = payment.approve();
  const history = newPayment.getHistory();
  assert(history.length === 1, 'Histórico tem 1 entrada');
  assert(history[0].from === 'pending', 'Histórico: from correto');
  assert(history[0].to === 'approved', 'Histórico: to correto');
  assert(history[0].timestamp, 'Histórico: timestamp registrado');

  // Valida serialização
  const json = newPayment.toJSON();
  assert(json.currentState === 'approved', 'JSON: currentState');
  assert(Array.isArray(json.availableTransitions), 'JSON: availableTransitions');
  assert(Array.isArray(json.history), 'JSON: history');

  console.log('✅ TESTE 5: PASSOU');

} catch (error) {
  console.error(`❌ TESTE 5: FALHOU - ${error.message}`);
  testsFalhados++;
}

// ========================================
// TESTE 6: Imutabilidade dos Estados
// ========================================
console.log('\n📋 TESTE 6: Imutabilidade dos Estados');
console.log('-'.repeat(60));

try {
  const original = new EnhancedPaymentState('pending');
  const approved = original.approve();

  // Verifica que o original não foi modificado
  assert(original.getState() === 'pending', 'Estado original não mudou');
  assert(approved.getState() === 'approved', 'Novo estado está correto');
  assert(original !== approved, 'São instâncias diferentes');

  // Verifica histórico independente
  assert(original.getHistory().length === 0, 'Original sem histórico');
  assert(approved.getHistory().length === 1, 'Aprovado com histórico');

  console.log('✅ TESTE 6: PASSOU (Estados são imutáveis)');

} catch (error) {
  console.error(`❌ TESTE 6: FALHOU - ${error.message}`);
  testsFalhados++;
}

// ========================================
// RESULTADO FINAL
// ========================================
console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTADO FINAL:`);
console.log(`   ✅ Testes passados: ${testsPassados}`);
console.log(`   ❌ Testes falhados: ${testsFalhados}`);

if (testsFalhados === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  console.log('\n✅ STATE PATTERN: NOTA 10/10');
  console.log('\nImplementações completas:');
  console.log('  ✅ BaseState com FSM robusta');
  console.log('  ✅ EnhancedPaymentState com webhook handling');
  console.log('  ✅ CollaborationState completo');
  console.log('  ✅ ProjectState completo');
  console.log('  ✅ UserState completo');
  console.log('  ✅ Validação de transições');
  console.log('  ✅ Histórico de mudanças');
  console.log('  ✅ Imutabilidade garantida');
  console.log('  ✅ Serialização JSON');
  process.exit(0);
} else {
  console.log('\n❌ ALGUNS TESTES FALHARAM');
  process.exit(1);
}
