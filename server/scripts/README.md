# 🛠️ SCRIPTS E UTILITÁRIOS
*Arquivos de desenvolvimento, testes e debug*

## 📁 **CONTEÚDO DESTA PASTA**

### **🧪 Scripts de Teste Principais**
- `test-backend-completo.js` - **TESTE COMPLETO DE TODAS AS ROTAS DO BACKEND**
- `test-mercadopago.js` - **TESTE COMPLETO DE TODAS AS ROTAS DO MERCADO PAGO**
- `test-curl.bat` - Testes via curl para endpoints

### **🔧 Scripts Utilitários**
- `consultar-pagamento.js` - Consulta status de pagamentos
- `debug-senha.js` - Debug da validação de senhas
- `fix-donation-repo.js` - Correção de repositório de doações
- `get-valid-org-id.js` - Obter IDs válidos de organizações
- `generate-tree.ps1` - Gerar árvore de arquivos
- `tree.bat` - Visualizar estrutura do projeto

## 🎯 **COMO USAR**

### **🚀 Para executar testes principais:**
```bash
# TESTE COMPLETO DO BACKEND (todas as rotas)
node scripts/test-backend-completo.js

# TESTE COMPLETO DO MERCADO PAGO (pagamentos)
node scripts/test-mercadopago.js

# Teste via curl (Windows)
scripts/test-curl.bat
```

### **Para debug:**
```bash
# Debug de validação de senhas
node scripts/debug-senha.js

# Consultar pagamento específico
node scripts/consultar-pagamento.js

# Obter ID válido de organização
node scripts/get-valid-org-id.js
```

### **Para utilitários:**
```bash
# Gerar árvore do projeto
scripts/tree.bat

# Ou no PowerShell
scripts/generate-tree.ps1
```

## 📝 **OBSERVAÇÕES**

- Estes arquivos foram movidos da raiz para manter o projeto organizado
- São ferramentas de desenvolvimento, não fazem parte do código de produção
- Podem ser removidos em deploy final se necessário
- Mantidos para histórico e debug durante desenvolvimento

---

*Pasta criada durante reorganização do projeto para TCC*  
*Data: 29/09/2025*
