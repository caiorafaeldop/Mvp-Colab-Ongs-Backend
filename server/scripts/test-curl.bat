@echo off
echo 🧪 TESTANDO MELHORIAS COM CURL
echo ===============================
echo.

echo 📋 Primeiro, vamos testar se o servidor atual está rodando...
curl -s http://localhost:3000/health > nul
if %errorlevel% neq 0 (
    echo ❌ Servidor não está rodando em localhost:3000
    echo 💡 Execute 'npm start' ou 'node server.js' primeiro
    echo.
    pause
    exit /b 1
)

echo ✅ Servidor está rodando!
echo.

echo 🏥 TESTE 1: Health Check
echo ========================
curl -X GET http://localhost:3000/health
echo.
echo.

echo 📊 TESTE 2: Swagger (se disponível)
echo ===================================
echo 💡 Acesse: http://localhost:3000/api-docs
echo 💡 Ou: http://localhost:3000/docs
echo.

echo 🔐 TESTE 3: Registro com dados válidos (rota original)
echo ======================================================
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"João Teste\",\"email\":\"joao.teste@example.com\",\"password\":\"MinhaSenh@123\",\"phone\":\"(11) 99999-9999\"}"
echo.
echo.

echo 🔑 TESTE 4: Login com dados válidos (rota original)
echo ===================================================
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"joao.teste@example.com\",\"password\":\"MinhaSenh@123\"}"
echo.
echo.

echo 💰 TESTE 5: Criar doação (se rota existir)
echo ===========================================
curl -X GET http://localhost:3000/api/donations
echo.
echo.

echo 📤 TESTE 6: Upload (se rota existir)
echo ====================================
curl -X GET http://localhost:3000/api/upload
echo.
echo.

echo 🏆 TESTES CONCLUÍDOS!
echo ======================
echo ✅ Se você viu respostas JSON, o servidor está funcionando
echo 💡 Para testar as melhorias V2, integre primeiro no server.js
echo 💡 Ou execute: node test-melhorias.js
echo.
pause
