/**
 * Teste simples das rotas de doação
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDonations() {
  console.log('=== TESTE SIMPLES DAS DOAÇÕES ===\n');
  
  try {
    // Teste de doação única
    const donationData = {
      organizationId: 'test-org-123',
      organizationName: 'ONG Teste',
      amount: 25.50,
      donorName: 'João Doador',
      donorEmail: 'joao.doador@test.com',
      donorPhone: '(11) 99999-9999'
    };
    
    console.log('Testando doação única...');
    console.log('Dados enviados:', JSON.stringify(donationData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/donations/single`, donationData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('\n✅ SUCESSO!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ ERRO!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
}

testDonations();
