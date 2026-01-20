# 🚀 Guia Rápido de Instalação e Execução

## ✅ Checklist de Entrega da Atividade 4

### 📦 1. Estrutura de Pastas

```
conservatorio/
├── ✅ index.html
├── ✅ style.css  
├── ✅ script.js
├── ✅ api.js
├── ✅ agente.js
├── ✅ img/logo-conser.png
│
├── ✅ cypress/
│   ├── ✅ e2e/
│   │   ├── ✅ ct01-cadastro-maior-idade.cy.js
│   │   ├── ✅ ct02-cadastro-menor-idade.cy.js
│   │   ├── ✅ ct03-bloqueio-inadimplencia.cy.js
│   │   ├── ✅ ct04-consulta-cep.cy.js
│   │   └── ✅ ct05-assistente-ia.cy.js
│   │
│   └── ✅ support/
│       ├── ✅ commands.js
│       └── ✅ e2e.js
│
├── ✅ cypress.config.js
├── ✅ package.json
├── ✅ README.md
└── ✅ CENARIOS_TESTE.md (ou .pdf/.docx)
```

---

## 🔧 Passo a Passo - INSTALAÇÃO

### PASSO 1️⃣: Verificar Node.js

```bash
node --version
# Deve retornar v16.x.x ou superior
```

Se não tiver Node.js instalado:
- Windows/Mac: https://nodejs.org/
- Linux: `sudo apt install nodejs npm`

---

### PASSO 2️⃣: Inicializar Projeto

No terminal, dentro da pasta do projeto:

```bash
# Criar package.json (se ainda não existe)
npm init -y

# Instalar Cypress
npm install --save-dev cypress

# Instalar http-server (opcional, para rodar o site)
npm install --save-dev http-server
```

---

### PASSO 3️⃣: Verificar Instalação do Cypress

```bash
npx cypress --version
# Deve retornar: Cypress version 13.x.x
```

---

### PASSO 4️⃣: Criar Estrutura de Pastas do Cypress

```bash
# Abrir Cypress pela primeira vez (cria estrutura automática)
npx cypress open
```

Isso criará:
- `cypress/e2e/`
- `cypress/fixtures/`
- `cypress/support/`

Feche a janela do Cypress após verificar.

---

### PASSO 5️⃣: Adicionar Arquivos de Teste

Copie os 5 arquivos de teste para `cypress/e2e/`:
- ✅ `ct01-cadastro-maior-idade.cy.js`
- ✅ `ct02-cadastro-menor-idade.cy.js`
- ✅ `ct03-bloqueio-inadimplencia.cy.js`
- ✅ `ct04-consulta-cep.cy.js`
- ✅ `ct05-assistente-ia.cy.js`

---

### PASSO 6️⃣: Configurar cypress.config.js

Crie o arquivo `cypress.config.js` na raiz do projeto com o conteúdo fornecido.

---

### PASSO 7️⃣: Configurar Commands.js

Adicione os comandos customizados em `cypress/support/commands.js`

---

### PASSO 8️⃣: Criar/Atualizar package.json

Adicione os scripts úteis no `package.json` conforme fornecido.

---

## 🎯 Passo a Passo - EXECUÇÃO

### EXECUTAR O SISTEMA

**Opção A: Live Server (VS Code)**
```
1. Instale extensão "Live Server" no VS Code
2. Clique direito em index.html
3. "Open with Live Server"
4. Abre em http://localhost:5500
```

**Opção B: http-server (Node)**
```bash
npm start
# ou
npx http-server -p 5500
```

**Opção C: Python**
```bash
python -m http.server 5500
```

✅ Confirme que o sistema abre em: `http://localhost:5500`

---

### EXECUTAR OS TESTES

**Modo Interativo (Recomendado para Debug)**
```bash
npm run cypress:open

# Ou
npx cypress open
```

Depois:
1. Clique em "E2E Testing"
2. Escolha navegador (Chrome)
3. Clique em cada arquivo .cy.js para rodar

**Modo Headless (Todos os Testes)**
```bash
npm test

# Ou
npx cypress run
```

**Modo Headless (Teste Específico)**
```bash
npm run test:ct01  # Apenas CT-01
npm run test:ct02  # Apenas CT-02
npm run test:ct03  # Apenas CT-03
npm run test:ct04  # Apenas CT-04
npm run test:ct05  # Apenas CT-05
```

---

## 📊 Verificar Resultados

### No Terminal
Após executar `npm test`, você verá:
```
✓ CT-01: Cadastro de Candidato Maior de Idade (5 testes)
✓ CT-02: Cadastro de Menor com Responsável (4 testes)
✓ CT-03: Bloqueio por Inadimplência (3 testes)
✓ CT-04: Consulta CEP (7 testes)
✓ CT-05: Assistente IA (8 testes)

27 passing (45s)
```

### Vídeos e Screenshots
- **Vídeos:** `cypress/videos/`
- **Screenshots:** `cypress/screenshots/`

---

## 🐛 Troubleshooting Comum

### ❌ Erro: "Cannot find module 'cypress'"

**Solução:**
```bash
npm install --save-dev cypress
```

---

### ❌ Erro: "baseUrl not found"

**Solução:** Certifique-se de que o sistema está rodando em `localhost:5500`

```bash
# Terminal 1: Rodar o sistema
npm start

# Terminal 2: Rodar testes
npm test
```

---

### ❌ Erro: Timeout ao consultar CEP

**Solução:** Aumentar timeout no `cypress.config.js`
```javascript
requestTimeout: 30000,
responseTimeout: 30000
```

---

### ❌ Erro: Modal não aparece

**Possíveis causas:**
1. MongoDB não está rodando
2. API de inadimplência offline
3. Timeout muito curto

**Solução:**
```javascript
// No teste, aumentar wait
cy.wait(5000)  // ao invés de 3000
```

---

### ❌ Erro: "Cypress binary not found"

**Solução:**
```bash
npx cypress install
npx cypress verify
```

---

## 📝 Gerar Documentação em PDF

### Converter CENARIOS_TESTE.md para PDF

**Opção 1: Usando VS Code**
1. Instale extensão "Markdown PDF"
2. Abra `CENARIOS_TESTE.md`
3. Ctrl+Shift+P → "Markdown PDF: Export (pdf)"

**Opção 2: Pandoc (Linux/Mac)**
```bash
pandoc CENARIOS_TESTE.md -o CENARIOS_TESTE.pdf
```

**Opção 3: Online**
- https://www.markdowntopdf.com/
- Cole o conteúdo e baixe PDF

---

## 📤 Preparar Entrega

### Checklist Final

- [ ] ✅ Código-fonte organizado em pastas
- [ ] ✅ 5 arquivos de teste em `cypress/e2e/`
- [ ] ✅ Documento `CENARIOS_TESTE.pdf` (ou .md)
- [ ] ✅ `README.md` atualizado
- [ ] ✅ `cypress.config.js` configurado
- [ ] ✅ `package.json` com scripts
- [ ] ✅ Todos os testes passando
- [ ] ✅ Screenshots/vídeos gerados

### Comprimir para Entrega

**Windows:**
1. Selecione a pasta `conservatorio`
2. Clique direito → "Enviar para" → "Pasta compactada"

**Linux/Mac:**
```bash
zip -r conservatorio.zip conservatorio/ -x "*/node_modules/*"
```

**Ou use Git:**
```bash
git init
git add .
git commit -m "Atividade 4 - Testes Cypress"
# Push para GitHub e compartilhe link
```

---

## 🎓 Dicas para Apresentação

1. **Mostre o sistema funcionando** (Live Server)
2. **Execute testes no modo interativo** (Cypress GUI)
3. **Explique cada cenário** antes de rodar
4. **Mostre vídeos/screenshots** de testes bem-sucedidos
5. **Destaque comandos customizados** (`commands.js`)

---

## ✨ Extras (Opcional)

### Gerar Relatório HTML

```bash
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator

# Rodar testes com relatório
npx cypress run --reporter mochawesome
```

---

**Pronto! 🎉**

Seu projeto está completo e pronto para entrega!

Se precisar de ajuda, consulte:
- 📖 `README.md`
- 📋 `CENARIOS_TESTE.md`
- 🌐 https://docs.cypress.io/