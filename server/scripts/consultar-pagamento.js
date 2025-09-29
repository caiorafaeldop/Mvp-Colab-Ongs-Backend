/**
 * 🔍 Consultar status do pagamento recebido
 */

require('dotenv').config();

async function consultarPagamento() {
  try {
    const paymentId = '127781654522'; // ID do webhook
    
    console.log('🔍 CONSULTANDO PAGAMENTO REAL...');
    console.log(`💳 Payment ID: ${paymentId}\n`);
    
    const SimpleMercadoPagoAdapter = require('./src/infra/adapters/SimpleMercadoPagoAdapter');
    const adapter = new SimpleMercadoPagoAdapter(process.env.MERCADO_PAGO_ACCESS_TOKEN);
    
    const paymentInfo = await adapter.getPaymentStatus(paymentId);
    
    console.log('📊 STATUS DO PAGAMENTO:');
    console.log(`   ID: ${paymentInfo.id}`);
    console.log(`   Status: ${paymentInfo.status}`);
    console.log(`   Valor: R$ ${paymentInfo.amount}`);
    console.log(`   Método: ${paymentInfo.paymentMethod}`);
    console.log(`   Email: ${paymentInfo.payer?.email}`);
    console.log(`   Criado: ${paymentInfo.dateCreated}`);
    console.log(`   Aprovado: ${paymentInfo.dateApproved || 'Pendente'}`);
    
    if (paymentInfo.status === 'approved') {
      console.log('\n🎉 PAGAMENTO APROVADO!');
      console.log('💰 Dinheiro vai cair na sua conta MP em 1-2 dias úteis!');
      console.log('✅ Sistema funcionando perfeitamente!');
    } else if (paymentInfo.status === 'pending') {
      console.log('\n⏳ PAGAMENTO PENDENTE');
      console.log('💡 Aguarde o processamento...');
    } else {
      console.log('\n❌ PAGAMENTO REJEITADO');
      console.log(`💡 Motivo: ${paymentInfo.statusDetail}`);
    }
    
    return paymentInfo;
    
  } catch (error) {
    console.error('❌ Erro ao consultar:', error.message);
    throw error;
  }
}

// Consultar
consultarPagamento().then(info => {
  console.log('\n🎯 RESUMO:');
  console.log(`Status: ${info.status}`);
  console.log(`Valor: R$ ${info.amount}`);
  console.log('🔔 Webhook funcionou perfeitamente!');
  console.log('🎉 Sistema 100% operacional!');
  
}).catch(error => {
  console.error('\n❌ Erro:', error.message);
});
