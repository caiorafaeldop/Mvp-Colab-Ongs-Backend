# Husky - Git Hooks Automatizados 🐕

## 🎯 O Que É?

**Husky** é uma ferramenta que adiciona **hooks do Git** para validar seu código **antes de fazer commit ou push**.

### Analogia:

É como um **guarda de segurança** na porta do Git:

```
Você → git commit → 🐕 Husky verifica → ✅ Autoriza (ou ❌ Bloqueia)
```

---

## ✅ O Que Foi Implementado

### 1. **Pre-Commit Hook** (Antes de CADA commit)

Quando você rodar `git commit`, o Husky automaticamente:

1. ✅ **Formata o código** (Prettier)
2. ✅ **Corrige lint** (ESLint --fix)
3. ✅ **Verifica Singletons** (uso correto)
4. ✅ **Roda testes rápidos** (Singletons)

**Se TUDO passar:** ✅ Commit autorizado  
**Se ALGO falhar:** ❌ Commit BLOQUEADO

---

### 2. **Pre-Push Hook** (Antes de CADA push)

Quando você rodar `git push`, o Husky automaticamente:

1. ✅ **Lint completo** (todo o código)
2. ✅ **Verifica Singletons**
3. ✅ **Roda TODOS os testes**

**Validação mais rigorosa para garantir qualidade no repositório remoto.**

---

## 📦 Ferramentas Instaladas

```json
{
  "husky": "🐕 Git hooks",
  "lint-staged": "📝 Lint apenas arquivos modificados",
  "eslint": "🔍 Detecta erros de código",
  "prettier": "💅 Formata código automaticamente"
}
```

---

## 🚀 Como Funciona na Prática

### Exemplo 1: Commit com Código Bom ✅

```bash
git add .
git commit -m "feat: adiciona nova feature"

# Output:
🐕 Husky: Validando código antes do commit...

📝 Rodando formatação e lint...
✔ src/application/MyService.js (formatado e corrigido)

🔍 Verificando padrões de Singleton...
✅ 0 problemas detectados

🧪 Rodando testes dos Singletons...
✅ 69 passed

✅ Todas as validações passaram! Commit autorizado.
[main abc1234] feat: adiciona nova feature
```

---

### Exemplo 2: Commit com Erro ❌

```bash
git add .
git commit -m "fix: corrige bug"

# Output:
🐕 Husky: Validando código antes do commit...

📝 Rodando formatação e lint...
❌ ESLint found 3 errors:
  - src/services/MyService.js:45 - 'db' is not defined
  - src/services/MyService.js:67 - Unexpected console.log

❌ Commit BLOQUEADO!
```

**Você precisa corrigir os erros primeiro!**

---

## 🛠️ Comandos Disponíveis

### Lint e Formatação

```bash
# Verificar erros de lint
npm run lint

# Corrigir erros automaticamente
npm run lint:fix

# Formatar código
npm run format

# Verificar formatação
npm run format:check

# Validação completa
npm run validate
```

### Testar Hooks Manualmente

```bash
# Simular pre-commit
npm run lint:fix && npm run verify:singletons && npm run test:singletons

# Simular pre-push
npm run lint && npm run verify:singletons && npm test
```

---

## 📋 O Que Cada Ferramenta Faz

### ESLint 🔍

**Detecta erros de código:**

```javascript
// ❌ ERRO: variável não definida
function getData() {
  return db.users.find(); // 'db' is not defined
}

// ❌ ERRO: variável não usada
function calculate() {
  const result = 10 + 20; // 'result' is assigned but never used
  return 30;
}

// ✅ CORRETO
function getData() {
  const db = DatabaseConnection.getInstance();
  return db.users.find();
}
```

---

### Prettier 💅

**Formata código automaticamente:**

```javascript
// Antes (bagunçado)
const data={name:"John",age:30,city:"NYC"}
function test(){console.log(data)}

// Depois (formatado)
const data = {
  name: 'John',
  age: 30,
  city: 'NYC',
};

function test() {
  console.log(data);
}
```

---

### Lint-Staged 📝

**Roda lint/format apenas nos arquivos modificados:**

```bash
# Sem lint-staged (lento)
eslint src/**/*.js  # Verifica TODOS os 500 arquivos

# Com lint-staged (rápido)
eslint src/MyService.js  # Verifica APENAS o arquivo modificado
```

---

## ⚙️ Configurações

### ESLint (`.eslintrc.js`)

```javascript
rules: {
  'no-console': 'off',        // Permitir console.log
  'no-unused-vars': 'warn',   // Avisar sobre variáveis não usadas
  'no-undef': 'error',        // ERRO se variável não definida
  'eqeqeq': 'error',          // Usar === ao invés de ==
}
```

### Prettier (`.prettierrc.js`)

```javascript
{
  semi: true,           // Ponto e vírgula
  singleQuote: true,    // Aspas simples
  printWidth: 100,      // Máximo 100 caracteres por linha
  tabWidth: 2,          // 2 espaços de indentação
}
```

### Lint-Staged (`package.json`)

```json
"lint-staged": {
  "*.js": [
    "eslint --fix",      // Corrigir erros
    "prettier --write"   // Formatar
  ],
  "*.{json,md}": [
    "prettier --write"   // Formatar JSON e Markdown
  ]
}
```

---

## 🎓 Para o TCC

### Benefícios que Você Pode Citar

1. ✅ **Qualidade de Código Garantida**
   - Erros detectados antes do commit
   - Código sempre formatado
   - Padrões consistentes

2. ✅ **Prevenção de Bugs**
   - Testes rodados automaticamente
   - Variáveis undefined detectadas
   - Singletons sempre usados corretamente

3. ✅ **Produtividade da Equipe**
   - Revisões de código mais rápidas
   - Menos tempo corrigindo estilo
   - Foco em lógica, não formatação

4. ✅ **Profissionalismo**
   - Padrão usado por empresas como Google, Facebook
   - Automação de qualidade
   - CI/CD facilitado

---

## 🚫 Ignorando Hooks (Emergência)

**APENAS em caso de emergência:**

```bash
# Pular pre-commit (NÃO RECOMENDADO!)
git commit --no-verify -m "emergency fix"

# Pular pre-push (NÃO RECOMENDADO!)
git push --no-verify
```

⚠️ **Use com cuidado!** Você pode introduzir bugs.

---

## 🔧 Troubleshooting

### Problema: "Husky command not found"

**Solução:**
```bash
npm install
npx husky install
```

### Problema: "lint-staged não funciona"

**Solução:**
```bash
# Verificar se arquivos estão staged
git status

# Rodar manualmente
npx lint-staged
```

### Problema: "Testes muito lentos no pre-commit"

**Solução:** Edite `.husky/pre-commit` e comente a linha dos testes:

```bash
# npm run test:singletons -- --bail --maxWorkers=2
```

---

## 📊 Fluxo Completo

```
1. Você edita código
   ↓
2. git add .
   ↓
3. git commit -m "mensagem"
   ↓
4. 🐕 Husky Pre-Commit Hook
   ├─ Prettier formata
   ├─ ESLint corrige
   ├─ Verifica Singletons
   └─ Roda testes
   ↓
5a. ✅ Tudo OK → Commit criado
   ↓
6. git push
   ↓
7. 🐕 Husky Pre-Push Hook
   ├─ Lint completo
   ├─ Verifica Singletons
   └─ Todos os testes
   ↓
8a. ✅ Tudo OK → Push realizado

OU

5b. ❌ Erro detectado → Commit BLOQUEADO
   ↓
   Você corrige o erro
   ↓
   Volta pro passo 3

OU

8b. ❌ Erro detectado → Push BLOQUEADO
   ↓
   Você corrige o erro
   ↓
   Volta pro passo 6
```

---

## ✅ Checklist de Implementação

- [x] Husky instalado
- [x] ESLint configurado
- [x] Prettier configurado
- [x] Lint-staged configurado
- [x] Pre-commit hook criado
- [x] Pre-push hook criado
- [x] Scripts npm criados
- [x] Documentação completa
- [x] `.prettierrc.js` criado
- [x] `.eslintrc.js` criado
- [x] `.prettierignore` criado

---

## 🎯 Resumo em 3 Linhas

1. **Husky** = Git hooks automatizados
2. **Valida código ANTES de commit/push**
3. **Garante qualidade sem esforço manual**

---

## 📚 Próximos Passos

1. Testar fazendo um commit
2. Ver os hooks em ação
3. Corrigir erros se aparecerem
4. Aproveitar código de qualidade! 🎉

---

*Documentação criada em: 2025-09-30*  
*Status: ✅ Husky Operacional*
