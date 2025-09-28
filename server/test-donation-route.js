/**
 * 🧪 TESTE DA ROTA DE DOAÇÃO
 * Confirma que a rota /api/donations/donate está funcionando
 */

const axios = require('axios');

async function testDonationRoute() {
  try {
    console.log('🧪 TESTANDO ROTA DE DOAÇÃO...\n');
    
    const payload = {
      amount: 1.00,
      donorName: "Caio Rafael",
      donorEmail: "caiorafaeldop@gmail.com",
      donorPhone: "83998632140",
      donorDocument: "12345678901",
      donorAddress: "Rua Exemplo, 123",
      donorCity: "João Pessoa",
      donorState: "PB",
      donorZipCode: "58000-000",
      message: "Doação recorrente de teste - R$ 1,00 mensal",
      type: "recurring",
      frequency: "monthly",
      isAnonymous: false,
      showInPublicList: true
    };
    
    console.log('📋 PAYLOAD:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n🔗 FAZENDO REQUEST PARA: POST /api/donations/donate\n');
    
    const response = await axios.post('http://localhost:3000/api/donations/donate', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCESSO!');
    console.log('📊 Status:', response.status);
    console.log('📦 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.payment?.paymentUrl) {
      console.log('\n🔗 LINK DE PAGAMENTO:');
      console.log(response.data.payment.paymentUrl);
      console.log('\n💰 Abra este link para completar a doação recorrente!');
    }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Erro:', error.message);
    }
    
    console.log('\n🔧 POSSÍVEIS CAUSAS:');
    console.log('1. Servidor não está rodando (npm run dev)');
    console.log('2. Rota não está registrada corretamente');
    console.log('3. Erro na validação dos dados');
    console.log('4. Problema com Mercado Pago');
  }
}

// Executar teste
testDonationRoute();
