const express = require('express');

/**
 * Rotas Mock para simular checkout do Mercado Pago
 * Útil para testes sem precisar fazer transações reais
 */
const createMockRoutes = () => {
  const router = express.Router();

  /**
   * Página de checkout mock para pagamento único
   */
  router.get('/payment/:paymentId', (req, res) => {
    const { paymentId } = req.params;

    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Checkout Mock - Mercado Pago</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
          }
          .logo {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            margin: 0 auto 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
          }
          .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .payment-id {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 30px;
            font-family: monospace;
            font-size: 12px;
            color: #666;
            word-break: break-all;
          }
          .buttons {
            display: flex;
            gap: 15px;
            flex-direction: column;
          }
          button {
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }
          .btn-approve {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
          }
          .btn-approve:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(17, 153, 142, 0.3);
          }
          .btn-reject {
            background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
            color: white;
          }
          .btn-reject:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(238, 9, 121, 0.3);
          }
          .warning {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
            color: #856404;
            font-size: 14px;
          }
          .success-msg, .error-msg {
            display: none;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            font-weight: 600;
          }
          .success-msg {
            background: #d4edda;
            color: #155724;
            border: 2px solid #c3e6cb;
          }
          .error-msg {
            background: #f8d7da;
            color: #721c24;
            border: 2px solid #f5c6cb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">💳</div>
          <h1>Checkout Mock</h1>
          <p class="subtitle">Simulação de Pagamento - Mercado Pago</p>
          
          <div class="payment-id">
            <strong>ID do Pagamento:</strong><br>
            ${paymentId}
          </div>

          <div class="buttons">
            <button class="btn-approve" onclick="processPayment('approved')">
              ✓ Aprovar Pagamento
            </button>
            <button class="btn-reject" onclick="processPayment('rejected')">
              ✗ Rejeitar Pagamento
            </button>
          </div>

          <div class="warning">
            ⚠️ <strong>MODO DE TESTE</strong><br>
            Este é um checkout simulado. Nenhuma transação real será processada.
          </div>

          <div class="success-msg" id="success-msg">
            ✓ Pagamento aprovado com sucesso!<br>
            Você pode fechar esta janela.
          </div>

          <div class="error-msg" id="error-msg">
            ✗ Pagamento rejeitado.<br>
            Você pode fechar esta janela.
          </div>
        </div>

        <script>
          function processPayment(status) {
            const buttons = document.querySelector('.buttons');
            const successMsg = document.getElementById('success-msg');
            const errorMsg = document.getElementById('error-msg');
            
            buttons.style.display = 'none';
            
            if (status === 'approved') {
              successMsg.style.display = 'block';
            } else {
              errorMsg.style.display = 'block';
            }

            // Simula webhook para o backend
            fetch('/api/donations/webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'payment',
                data: { id: '${paymentId}' },
                action: status === 'approved' ? 'payment.updated' : 'payment.rejected'
              })
            }).catch(err => console.error('Erro ao enviar webhook:', err));

            // Fecha a janela após 3 segundos
            setTimeout(() => {
              window.close();
            }, 3000);
          }
        </script>
      </body>
      </html>
    `);
  });

  /**
   * Página de checkout mock para assinatura
   */
  router.get('/subscription/:subscriptionId', (req, res) => {
    const { subscriptionId } = req.params;

    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Checkout Mock - Assinatura</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
          }
          .logo {
            width: 120px;
            height: 120px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 50%;
            margin: 0 auto 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
          }
          .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .subscription-id {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 30px;
            font-family: monospace;
            font-size: 12px;
            color: #666;
            word-break: break-all;
          }
          .buttons {
            display: flex;
            gap: 15px;
            flex-direction: column;
          }
          button {
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }
          .btn-approve {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
          }
          .btn-approve:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(17, 153, 142, 0.3);
          }
          .btn-reject {
            background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
            color: white;
          }
          .btn-reject:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(238, 9, 121, 0.3);
          }
          .warning {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
            color: #856404;
            font-size: 14px;
          }
          .success-msg, .error-msg {
            display: none;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            font-weight: 600;
          }
          .success-msg {
            background: #d4edda;
            color: #155724;
            border: 2px solid #c3e6cb;
          }
          .error-msg {
            background: #f8d7da;
            color: #721c24;
            border: 2px solid #f5c6cb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🔄</div>
          <h1>Assinatura Mock</h1>
          <p class="subtitle">Simulação de Assinatura Recorrente - Mercado Pago</p>
          
          <div class="subscription-id">
            <strong>ID da Assinatura:</strong><br>
            ${subscriptionId}
          </div>

          <div class="buttons">
            <button class="btn-approve" onclick="processSubscription('authorized')">
              ✓ Autorizar Assinatura
            </button>
            <button class="btn-reject" onclick="processSubscription('rejected')">
              ✗ Rejeitar Assinatura
            </button>
          </div>

          <div class="warning">
            ⚠️ <strong>MODO DE TESTE</strong><br>
            Esta é uma assinatura simulada. Nenhuma cobrança real será feita.
          </div>

          <div class="success-msg" id="success-msg">
            ✓ Assinatura autorizada com sucesso!<br>
            Você pode fechar esta janela.
          </div>

          <div class="error-msg" id="error-msg">
            ✗ Assinatura rejeitada.<br>
            Você pode fechar esta janela.
          </div>
        </div>

        <script>
          function processSubscription(status) {
            const buttons = document.querySelector('.buttons');
            const successMsg = document.getElementById('success-msg');
            const errorMsg = document.getElementById('error-msg');
            
            buttons.style.display = 'none';
            
            if (status === 'authorized') {
              successMsg.style.display = 'block';
            } else {
              errorMsg.style.display = 'block';
            }

            // Simula webhook para o backend
            fetch('/api/donations/webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'subscription',
                data: { id: '${subscriptionId}' },
                action: status === 'authorized' ? 'subscription.authorized' : 'subscription.rejected'
              })
            }).catch(err => console.error('Erro ao enviar webhook:', err));

            // Fecha a janela após 3 segundos
            setTimeout(() => {
              window.close();
            }, 3000);
          }
        </script>
      </body>
      </html>
    `);
  });

  return router;
};

module.exports = createMockRoutes;
