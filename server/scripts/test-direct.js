// Teste direto do controller sem passar pelas rotas
const DonationController = require('../src/presentation/controllers/DonationController');
const DonationService = require('../src/application/services/DonationService');
const MongoDonationRepository = require('../src/infra/repositories/MongoDonationRepository');

// Mock do PaymentAdapter
class MockPaymentAdapter {
  async createPaymentPreference(data) {
    return {
      id: 'mock-payment-' + Date.now(),
      paymentUrl: 'https://mock-payment-url.com',
      externalReference: data.externalReference
    };
  }
}

// Mock do PaymentState
class MockPaymentState {
  constructor(state) {
    this.state = state;
  }
  toDomain() {
    return this.state;
  }
}

async function testDirect() {
  try {
    console.log('=== TESTE DIRETO DO CONTROLLER ===');
    
    const donationRepository = new MongoDonationRepository();
    const paymentAdapter = new MockPaymentAdapter();
    const donationService = new DonationService(donationRepository, paymentAdapter);
    const donationController = new DonationController(donationService);
    
    // Mock request e response
    const req = {
      body: {
        organizationId: 'test-org-123',
        organizationName: 'ONG Teste',
        amount: 25.50,
        donorName: 'João Doador',
        donorEmail: 'joao.doador@test.com',
        donorPhone: '(11) 99999-9999'
      }
    };
    
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`Status: ${code}`);
          console.log('Response:', JSON.stringify(data, null, 2));
          return data;
        }
      })
    };
    
    console.log('Dados enviados:', JSON.stringify(req.body, null, 2));
    console.log('\nChamando controller...');
    
    await donationController.createSingleDonation(req, res);
    
  } catch (error) {
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDirect();
