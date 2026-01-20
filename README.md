# Sistema de Matrícula - Conservatório de Música de Pernambuco

![Status](https://img.shields.io/badge/status-ativo-success)
![Versão](https://img.shields.io/badge/versão-1.0-blue)
![Testes](https://img.shields.io/badge/testes-5%20cenários-green)

## 📋 Sobre o Projeto

Sistema web para gerenciamento de matrículas do Conservatório de Música de Pernambuco, desenvolvido com foco em usabilidade e automação de processos. O sistema integra verificação de inadimplência via IA, consulta automática de CEP e assistente virtual para suporte aos candidatos.

### ✨ Funcionalidades Principais

- ✅ Cadastro de candidatos maiores e menores de idade
- ✅ Verificação automática de inadimplência financeira
- ✅ Consulta de CEP com preenchimento automático (Brasil API)
- ✅ Validação de CPF e formatação automática de campos
- ✅ Assistente virtual inteligente (Agente IA)
- ✅ Sistema de alertas e notificações
- ✅ Geração de protocolo de matrícula
- ✅ Integração com MongoDB para persistência de dados

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização responsiva
- **JavaScript (ES6+)** - Lógica de negócio

### Integrações
- **MongoDB** - Banco de dados NoSQL
- **Brasil API** - Consulta de CEP
- **Agente IA** - Assistente virtual inteligente

### Testes
- **Cypress 13.x** - Framework de testes E2E
- **Mocha** - Test runner (incluído no Cypress)

---

## 📁 Estrutura de Pastas

```
conservatorio/
│
├── index.html              # Página principal
├── style.css               # Estilos da aplicação
├── script.js               # Lógica principal do formulário
├── api.js                  # Integração com APIs externas
├── agente.js               # Lógica do assistente IA
│
├── img/
│   └── logo-conser.png     # Logo do conservatório
│
├── cypress/
│   ├── e2e/
│   │   ├── ct01-cadastro-maior-idade.cy.js
│   │   ├── ct02-cadastro-menor-idade.cy.js
│   │   ├── ct03-bloqueio-inadimplencia.cy.js
│   │   ├── ct04-consulta-cep.cy.js
│   │   └── ct05-assistente-ia.cy.js
│   │
│   ├── fixtures/           # Dados de teste
│   ├── support/
│   │   ├── commands.js     # Comandos customizados
│   │   └── e2e.js          # Configurações globais
│   │
│   └── screenshots/        # Screenshots de falhas
│       └── videos/         # Vídeos de execução
│
├── cypress.config.js       # Configuração do Cypress
├── package.json            # Dependências do projeto
├── README.md               # Este arquivo
└── CENARIOS_TESTE.md       # Documentação dos cenários

```

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- **Node.js** v16 ou superior
- **npm** ou **yarn**
- **MongoDB** rodando localmente ou em nuvem
- **Navegador** Chrome, Firefox ou Edge
- **Live Server** (VS Code Extension) ou servidor HTTP local

### Passo 1: Clone o Repositório

```bash
git clone https://github.com/seu-usuario/conservatorio.git
cd conservatorio
```

### Passo 2: Instale as Dependências

```bash
npm install
```

Isso instalará:
- Cypress
- Outras dependências necessárias

### Passo 3: Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (se necessário):

```env
MONGODB_URI=mongodb://localhost:27017/conservatorio
API_KEY_AGENTE_IA=sua_chave_aqui
BRASIL_API_URL=https://brasilapi.com.br/api
```

### Passo 4: Inicie o MongoDB

```bash
# Se usando MongoDB local
mongod

# Ou conecte-se ao seu MongoDB Atlas/Cloud
```

---

## 🖥️ Como Rodar o Sistema

### Opção 1: Usando Live Server (VS Code)

1. Instale a extensão **Live Server** no VS Code
2. Clique com botão direito no `index.html`
3. Selecione **"Open with Live Server"**
4. O sistema abrirá em `http://localhost:5500`

### Opção 2: Usando Python

```bash
# Python 3
python -m http.server 5500

# Python 2
python -m SimpleHTTPServer 5500
```

Acesse: `http://localhost:5500`

### Opção 3: Usando Node.js http-server

```bash
npm install -g http-server
http-server -p 5500
```

Acesse: `http://localhost:5500`

---

## 🧪 Como Rodar os Testes

### Executar Todos os Testes (Modo Headless)

```bash
npm test
```

ou

```bash
npx cypress run
```

### Executar Testes com Interface Gráfica

```bash
npm run cypress:open
```

ou

```bash
npx cypress open
```

Depois:
1. Selecione **"E2E Testing"**
2. Escolha o navegador (Chrome recomendado)
3. Clique em um arquivo de teste para executar

### Executar Teste Específico

```bash
# Executar apenas CT-01
npx cypress run --spec "cypress/e2e/ct01-cadastro-maior-idade.cy.js"

# Executar apenas CT-03
npx cypress run --spec "cypress/e2e/ct03-bloqueio-inadimplencia.cy.js"
```

### Gerar Relatório de Testes

```bash
npm run test:report
```

---

## 📊 Cenários de Teste

### CT-01: Cadastro de Candidato Maior de Idade ✅
- Preenche formulário completo
- Valida formatação automática de CPF/telefone
- Verifica ausência de inadimplência
- Confirma geração de protocolo

### CT-02: Cadastro de Menor de Idade com Responsável ✅
- Exibe seção de responsável dinamicamente
- Valida dados do responsável legal
- Testa solicitação de isenção de mensalidade
- Verifica dupla validação de CPF

### CT-03: Bloqueio por Inadimplência Financeira ✅
- Detecta CPF com pendências
- Exibe modal de bloqueio
- Mostra detalhes da dívida
- Impede processamento da matrícula

### CT-04: Preenchimento Automático via CEP ✅
- Consulta Brasil API
- Preenche logradouro, bairro, cidade e UF
- Trata CEP inválido
- Permite edição manual dos campos

### CT-05: Assistente Virtual (Agente IA) ✅
- Abre/fecha chat flutuante
- Envia e recebe mensagens
- Mantém histórico da conversa
- Valida respostas contextualizadas

📄 **Documentação completa:** Veja `CENARIOS_TESTE.md`

---

## 🎯 Dados de Teste

### CPFs Válidos (Sem Pendência)
```
111.111.111-11  - Candidato Teste 1
222.222.222-22  - Candidato Teste 2 (menor)
333.333.333-33  - Responsável Legal
```

### CPF com Inadimplência
```
444.444.444-44  - BLOQUEADO (possui pendência)
```

### CEPs Válidos
```
50030-230  - Av. Guararapes, Santo Antônio, Recife/PE
51020-120  - Boa Viagem, Recife/PE
```

### CEP Inválido
```
00000-000  - Retorna erro
```

---

## 🐛 Solução de Problemas

### Problema: Testes falhando por timeout

**Solução:**
```javascript
// cypress.config.js
module.exports = {
  e2e: {
    defaultCommandTimeout: 10000,
    requestTimeout: 15000
  }
}
```

### Problema: Modal não aparece no teste

**Solução:**
- Verifique se MongoDB está rodando
- Confira se a API de inadimplência está respondendo
- Aumente o `cy.wait()` se necessário

### Problema: CEP não preenche automaticamente

**Solução:**
- Verifique conexão com internet
- Teste a Brasil API manualmente: `https://brasilapi.com.br/api/cep/v1/50030230`
- Confirme que o evento `blur` está sendo disparado

### Problema: Agente IA não responde

**Solução:**
- Verifique se a API Key está configurada
- Confira se há créditos na conta da API
- Veja o console do navegador para erros

---

## 📝 Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar sistema localmente
npm start

# Abrir Cypress (modo interativo)
npm run cypress:open

# Executar todos os testes (headless)
npm test

# Executar testes específicos
npm run test:ct01
npm run test:ct02
npm run test:ct03
npm run test:ct04
npm run test:ct05

# Limpar cache do Cypress
npx cypress cache clear

# Verificar versão do Cypress
npx cypress version

# Atualizar screenshots/vídeos
npm run test:record
```

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 👥 Equipe

- **Desenvolvimento:** Equipe CPM Dev
- **Testes:** QA Team
- **Design:** UI/UX Team

---

**Versão:** 1.0  
**Última Atualização:** 19/01/2026