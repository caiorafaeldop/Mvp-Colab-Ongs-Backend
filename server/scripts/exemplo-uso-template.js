/**
 * EXEMPLO PRÁTICO - Como usar templates no DonationController
 * Este é só um exemplo, não substitui o código atual
 */

const { TemplateExamples } = require('../src/application/templates');

// Simulação de como seria no DonationController
class ExemploDonationController {
  constructor(donationService) {
    this.donationService = donationService; // Service atual
  }
  
  // Método atual (continua funcionando)
  async createSingleDonationOriginal(req, res) {
    try {
      const result = await this.donationService.createSingleDonation(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Método NOVO usando template (opcional)
  async createSingleDonationComTemplate(req, res) {
    try {
      console.log('🎯 Usando Template Method para doação...');
      
      // Usar template (mais robusto)
      const result = await TemplateExamples.processDonation(
        req.donationData || req.validatedBody || req.body,
        'single',
        {
          donationRepository: this.donationService.donationRepository,
          userRepository: this.donationService.userRepository,
          paymentAdapter: this.donationService.paymentAdapter,
          logger: req.logger,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      
      // Resposta igual ao método original
      res.status(201).json({
        success: true,
        message: 'Doação única criada com sucesso',
        data: {
          donationId: result.data.donation.id || result.data.donation._id,
          paymentUrl: result.data.payment.paymentUrl,
          mercadoPagoId: result.data.payment.id,
          amount: result.data.donation.amount,
          organizationName: result.data.donation.organizationName
        }
      });
      
    } catch (error) {
      console.error('❌ Erro no template:', error.message);
      res.status(500).json({ 
        success: false, 
        message: error.message,
        requestId: req.requestId 
      });
    }
  }
}

// Exemplo de uso
async function exemploUso() {
  console.log('📋 EXEMPLO DE USO DOS TEMPLATES');
  console.log('===============================');
  
  // Dados de exemplo
  const dadosDoacao = {
    organizationId: '507f1f77bcf86cd799439012',
    organizationName: 'ONG Esperança',
    amount: 50,
    donorName: 'João Silva',
    donorEmail: 'joao@email.com',
    donorPhone: '11999999999',
    message: 'Parabéns pelo trabalho!'
  };
  
  console.log('📝 Dados da doação:', dadosDoacao);
  console.log('\n✅ Template processaria:');
  console.log('1. Validar dados (email, valor, etc.)');
  console.log('2. Preparar dados (buscar organização, normalizar)');
  console.log('3. Processar (criar no banco + Mercado Pago)');
  console.log('4. Finalizar (notificações, logs, estatísticas)');
  console.log('\n🎉 Tudo automático com logs e tratamento de erro!');
}

exemploUso();
