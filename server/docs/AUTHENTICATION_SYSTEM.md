# 🔐 Sistema de Autenticação Completo

## 📋 Visão Geral

Sistema completo de autenticação com verificação de email e recuperação de senha usando códigos de 6
dígitos.

---

## 🎯 Funcionalidades Implementadas

### ✅ Registro de Usuário

- Criação de conta com email e senha
- Suporte para dois tipos de usuário: `organization` e `common`
- Envio automático de código de verificação por email

### ✅ Verificação de Email

- Código de 6 dígitos enviado por email
- Validade de 15 minutos
- Rate limiting: máximo 3 tentativas em 5 minutos
- Possibilidade de reenviar código

### ✅ Recuperação de Senha

- Solicitação de código por email
- Redefinição de senha com código válido
- Mesmas proteções de segurança da verificação

### ✅ Login e Logout

- Login com email e senha
- Geração de tokens JWT (access + refresh)
- Logout com invalidação de tokens

---

## 🗄️ Estrutura do Banco de Dados

### Modelo User (atualizado)

```prisma
model User {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  email         String   @unique
  password      String
  userType      String   @default("organization")
  phone         String?
  emailVerified Boolean  @default(false) // ⭐ NOVO CAMPO
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Modelo VerificationCode (novo)

```prisma
model VerificationCode {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String
  code      String   // Código de 6 dígitos
  type      String   // 'email_verification' ou 'password_reset'
  expiresAt DateTime // Expira em 15 minutos
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email, type])
  @@index([code])
  @@index([expiresAt])
}
```

---

## 🔌 API Endpoints

### Verificação de Email

#### 1. Enviar Código de Verificação

```http
POST /api/auth/verify-email/send
Content-Type: application/json

{
  "email": "usuario@exemplo.com"
}
```

**Resposta (200):**

```json
{
  "success": true,
  "message": "Código de verificação enviado para seu email",
  "data": {
    "email": "usuario@exemplo.com",
    "expiresIn": "15 minutos",
    "previewUrl": "https://ethereal.email/message/..." // Apenas em dev
  }
}
```

#### 2. Verificar Código

```http
POST /api/auth/verify-email/verify
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "code": "123456"
}
```

**Resposta (200):**

```json
{
  "success": true,
  "message": "Email verificado com sucesso",
  "data": {
    "email": "usuario@exemplo.com",
    "verified": true
  }
}
```

#### 3. Reenviar Código

```http
POST /api/auth/verify-email/resend
Content-Type: application/json

{
  "email": "usuario@exemplo.com"
}
```

### Recuperação de Senha

#### 1. Solicitar Recuperação

```http
POST /api/auth/password-reset/request
Content-Type: application/json

{
  "email": "usuario@exemplo.com"
}
```

#### 2. Verificar Código de Recuperação

```http
POST /api/auth/password-reset/verify
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "code": "123456"
}
```

#### 3. Redefinir Senha

```http
POST /api/auth/password-reset/reset
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "code": "123456",
  "newPassword": "novaSenha123"
}
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente (.env)

```bash
# Email Configuration (opcional - usa Ethereal se não configurado)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM_NAME=Plataforma ONGs
EMAIL_FROM=noreply@plataformaongs.com
```

### 2. Configurar Gmail (Exemplo)

1. Acesse sua conta Google
2. Vá em "Segurança" → "Verificação em duas etapas"
3. Ative a verificação em duas etapas
4. Vá em "Senhas de app"
5. Gere uma senha para "Email"
6. Use essa senha no `.env` como `SMTP_PASS`

### 3. Instalar Dependências

```bash
npm install nodemailer
npx prisma generate
npx prisma db push
```

---

## 🧪 Testando o Sistema

### Teste Manual (Desenvolvimento)

1. **Registrar usuário:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Usuario",
    "email": "teste@exemplo.com",
    "password": "senha123",
    "phone": "11999999999",
    "userType": "common"
  }'
```

2. **Enviar código de verificação:**

```bash
curl -X POST http://localhost:3000/api/auth/verify-email/send \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@exemplo.com"}'
```

3. **Verificar no console do backend:**
   - Procure por `[EmailService]` nos logs
   - Copie a URL do Ethereal Email
   - Abra no navegador para ver o email

4. **Verificar código:**

```bash
curl -X POST http://localhost:3000/api/auth/verify-email/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "code": "123456"
  }'
```

### Teste de Recuperação de Senha

1. **Solicitar recuperação:**

```bash
curl -X POST http://localhost:3000/api/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@exemplo.com"}'
```

2. **Pegar código no email (Ethereal)**

3. **Redefinir senha:**

```bash
curl -X POST http://localhost:3000/api/auth/password-reset/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "code": "123456",
    "newPassword": "novaSenha456"
  }'
```

---

## 🔒 Segurança

### Proteções Implementadas

1. **Rate Limiting:**
   - Máximo 3 códigos em 5 minutos por email
   - Previne spam e ataques de força bruta

2. **Expiração de Códigos:**
   - Códigos válidos por apenas 15 minutos
   - Códigos antigos são invalidados automaticamente

3. **Uso Único:**
   - Cada código pode ser usado apenas uma vez
   - Códigos anteriores são invalidados ao gerar novo

4. **Validação:**
   - Email válido (formato)
   - Código de exatamente 6 dígitos
   - Senha mínima de 6 caracteres

5. **Hash de Senhas:**
   - Bcrypt com salt de 10 rounds
   - Senhas nunca são armazenadas em texto plano

---

## 📧 Templates de Email

### Email de Verificação

- Design moderno com gradiente azul/roxo
- Código destacado em fonte grande
- Informação de expiração (15 minutos)
- Aviso de segurança

### Email de Recuperação de Senha

- Design com gradiente rosa/vermelho
- Código destacado
- Aviso de segurança reforçado
- Instrução para ignorar se não solicitou

---

## 🏗️ Arquitetura

### Backend

```
src/
├── application/
│   ├── dtos/
│   │   └── index.js              # DTOs de validação (Zod)
│   └── use-cases/
│       ├── VerifyEmailUseCase.js
│       ├── PasswordResetUseCase.js
│       ├── RegisterUserUseCase.js
│       └── LoginUserUseCase.js
├── infra/
│   ├── repositories/
│   │   └── VerificationCodeRepository.js
│   └── services/
│       └── EmailService.js       # Nodemailer
└── presentation/
    ├── controllers/
    │   └── VerificationController.js
    └── routes/
        └── verificationRoutes.js
```

### Frontend

```
src/
├── api/
│   └── auth.ts                   # Funções de API
└── pages/
    ├── Login.tsx                 # Login + link recuperação
    ├── VerifyEmail.tsx           # Verificação após registro
    ├── ForgotPassword.tsx        # Solicitar recuperação
    └── ResetPassword.tsx         # Redefinir senha
```

---

## 🐛 Troubleshooting

### Problema: Emails não estão sendo enviados

**Solução:**

1. Verifique os logs do backend para erros do EmailService
2. Se estiver usando Ethereal (dev), copie a URL do preview
3. Se estiver usando SMTP real, verifique as credenciais no `.env`
4. Para Gmail, certifique-se de usar "Senha de app", não a senha normal

### Problema: Código inválido ou expirado

**Possíveis causas:**

- Código já foi usado (use apenas uma vez)
- Código expirou (15 minutos)
- Código digitado incorretamente
- Email diferente do usado no registro

**Solução:**

- Solicite um novo código
- Verifique se está usando o email correto

### Problema: Muitas tentativas

**Causa:**

- Rate limiting ativado (3 tentativas em 5 minutos)

**Solução:**

- Aguarde 5 minutos antes de tentar novamente

---

## 📊 Logs e Monitoramento

### Logs Importantes

O sistema registra os seguintes eventos:

```javascript
// Código enviado
[EmailService] Email de verificação enviado
  email: usuario@exemplo.com
  messageId: <...>
  previewUrl: https://ethereal.email/...

// Código verificado
[VerifyEmailUseCase] Email verificado com sucesso
  email: usuario@exemplo.com
  userId: 507f1f77bcf86cd799439011

// Senha redefinida
[PasswordResetUseCase] Senha redefinida com sucesso
  email: usuario@exemplo.com
  userId: 507f1f77bcf86cd799439011
```

---

## 🚀 Deploy em Produção

### Checklist

- [ ] Configurar SMTP real (não usar Ethereal)
- [ ] Definir `NODE_ENV=production`
- [ ] Configurar domínio no `EMAIL_FROM`
- [ ] Testar envio de emails em produção
- [ ] Configurar rate limiting no servidor
- [ ] Habilitar HTTPS
- [ ] Configurar CORS adequadamente
- [ ] Monitorar logs de erro

### Variáveis de Ambiente (Produção)

```bash
NODE_ENV=production
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx
EMAIL_FROM_NAME=Sua Plataforma
EMAIL_FROM=noreply@seudominio.com
```

---

## 📚 Recursos Adicionais

### Bibliotecas Utilizadas

- **nodemailer** - Envio de emails
- **bcrypt** - Hash de senhas
- **zod** - Validação de dados
- **prisma** - ORM para MongoDB

### Referências

- [Nodemailer Documentation](https://nodemailer.com/)
- [Ethereal Email](https://ethereal.email/) - Teste de emails
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## 🤝 Suporte

Para problemas ou dúvidas:

1. Verifique os logs do backend
2. Consulte esta documentação
3. Verifique as configurações do `.env`
4. Teste com Ethereal Email primeiro

---

**Documentação criada em:** 20/10/2025 **Versão:** 1.0.0
