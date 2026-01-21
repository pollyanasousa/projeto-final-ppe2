# DOCUMENTAÇÃO TÉCNICA
## Sistema de Matrícula CPM com Assistente Virtual Inteligente

---

## 1. VISÃO GERAL DO SISTEMA

### 1.1 Arquitetura
O sistema é composto por três camadas principais:
```
┌─────────────────────────────────────────┐
│     CAMADA DE APRESENTAÇÃO              │
│  Frontend (HTML/CSS/JavaScript)         │
│  GitHub Pages                           │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────────┐
│     CAMADA DE APLICAÇÃO                 │
│  Backend Node.js + Express              │
│  Porta: 3000                            │
└──────┬───────────────────┬──────────────┘
       │                   │
       │ MongoDB           │ Child Process
       │                   │
┌──────▼─────┐      ┌──────▼──────────────┐
│  MongoDB   │      │  Python RAG Engine  │
│   Atlas    │      │  - LangChain        │
│            │      │  - FAISS            │
│            │      │  - Groq API         │
└────────────┘      └─────────────────────┘
```

### 1.2 Tecnologias e Versões

**Frontend:**
- HTML5
- CSS3
- JavaScript (ES6+)
- Fetch API

**Backend:**
- Node.js: v18.x
- Express: ^4.18.0
- Mongoose: ^8.0.0
- CORS: ^2.8.5
- dotenv: ^16.0.0

**Python RAG:**
- Python: 3.11
- langchain: 0.3.7
- langchain-community: 0.3.7
- langchain-groq: 0.2.5
- faiss-cpu: 1.9.0
- sentence-transformers: 3.3.1
- pypdf: 5.1.0
- python-dotenv: 1.0.1
- scikit-learn (opcional)

---

## 2. INSTALAÇÃO E CONFIGURAÇÃO

### 2.1 Pré-requisitos

- Node.js 18 ou superior
- Python 3.11
- MongoDB Atlas conta (ou MongoDB local)
- Groq API Key (gratuita em https://console.groq.com)
- Git

### 2.2 Clonando o Repositório
```bash
git clone https://github.com/seu-usuario/projeto-final-ppe2.git
cd projeto-final-ppe2
```

### 2.3 Configuração do Backend

**Passo 1: Instalar dependências Node.js**
```bash
npm install
```

**Passo 2: Criar arquivo .env na pasta backend/**
```env
# MongoDB
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/cpm_db

# Groq API
GROQ_API_KEY=sua_chave_groq_aqui

# Servidor
PORT=3000
NODE_ENV=development
```

### 2.4 Configuração do Python RAG

**Passo 1: Criar ambiente virtual**
```bash
cd python_rag
python -m venv venv
```

**Passo 2: Ativar ambiente virtual**

Windows:
```bash
.\venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

**Passo 3: Instalar dependências**
```bash
pip install -r requirements.txt
```

**Passo 4: Adicionar PDFs dos editais**
- Coloque os arquivos PDF na pasta `python_rag/dados/`
- Formatos aceitos: .pdf
- Recomendado: máximo 3 arquivos para melhor performance

### 2.5 Iniciando o Sistema

**Terminal 1 - Backend:**
```bash
# Na pasta raiz
node index.js
```

Saída esperada:
```
Servidor rodando na porta 3000
MongoDB conectado com sucesso
```

**Terminal 2 - Frontend:**
```bash
# Abrir index.html no navegador
# Ou usar servidor local:
npx serve docs
```

---

## 3. ESTRUTURA DO PROJETO
```
projeto-final-ppe2/
│
├── docs/                          # Frontend (GitHub Pages)
│   ├── index.html                # Página principal
│   ├── style.css                 # Estilos
│   └── script.js                 # Lógica do frontend
│
├── backend/                       # Backend Node.js
│   ├── .env                      # Variáveis de ambiente (não versionado)
│   └── models/                   # Modelos MongoDB
│       └── Inscricao.js         # Schema de inscrição
│
├── python_rag/                    # Sistema RAG
│   ├── agente_cpm.py             # Script principal do RAG
│   ├── requirements.txt          # Dependências Python
│   ├── dados/                    # PDFs dos editais
│   │   ├── edital1.pdf
│   │   ├── edital2.pdf
│   │   └── edital3.pdf
│   ├── cache_faiss.index/        # Cache do índice FAISS
│   └── cache_store.pkl           # Cache do docstore
│
├── index.js                       # Servidor Express
├── package.json                   # Dependências Node
├── Dockerfile                     # Container config
├── .dockerignore                 # Arquivos ignorados no build
├── .gitignore                    # Arquivos não versionados
└── README.md                      # Documentação geral
```

---

## 4. API ENDPOINTS

### 4.1 POST /api/inscricoes
Cria nova inscrição de candidato.

**Request Body:**
```json
{
  "nomeCompleto": "João Silva Santos",
  "dataNascimento": "2000-05-15",
  "cpf": "123.456.789-00",
  "email": "joao@email.com",
  "telefone": "(81) 99999-9999",
  "menorIdade": false,
  "nomeResponsavel": "",
  "cpfResponsavel": ""
}
```

**Response Success (201):**
```json
{
  "mensagem": "Inscrição realizada com sucesso!",
  "inscricao": {
    "_id": "507f1f77bcf86cd799439011",
    "nomeCompleto": "João Silva Santos",
    "dataNascimento": "2000-05-15T00:00:00.000Z",
    "cpf": "12345678900",
    "email": "joao@email.com",
    "telefone": "81999999999",
    "menorIdade": false,
    "dataInscricao": "2026-01-21T14:30:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "erro": "CPF inválido"
}
```

---

### 4.2 POST /api/chat
Consulta o assistente virtual RAG.

**Request Body:**
```json
{
  "mensagem": "Qual o prazo para matrícula?"
}
```

**Response Success (200):**
```json
{
  "resposta": "De acordo com o Edital 01/2026, o prazo para matrícula é de 15 a 20 de fevereiro de 2026, conforme item 5.1 do documento."
}
```

**Response Error (500):**
```json
{
  "erro": "Erro ao processar pergunta",
  "detalhes": "Mensagem de erro detalhada"
}
```

---

## 5. BANCO DE DADOS

### 5.1 Schema MongoDB - Inscrições
```javascript
{
  nomeCompleto: {
    type: String,
    required: true,
    trim: true
  },
  dataNascimento: {
    type: Date,
    required: true
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{11}$/.test(v);
      }
    }
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      }
    }
  },
  telefone: {
    type: String,
    required: true
  },
  menorIdade: {
    type: Boolean,
    default: false
  },
  nomeResponsavel: String,
  cpfResponsavel: String,
  dataInscricao: {
    type: Date,
    default: Date.now
  }
}
```

### 5.2 Índices
```javascript
// CPF único
cpf: 1 (unique)

// Busca por data
dataInscricao: -1
```

---

## 6. SISTEMA RAG (RETRIEVAL-AUGMENTED GENERATION)

### 6.1 Fluxo de Processamento
```
1. Carregamento de PDFs
   ↓
2. Limpeza e normalização de texto
   ↓
3. Divisão em chunks (600 caracteres, overlap 150)
   ↓
4. Geração de embeddings (sentence-transformers)
   ↓
5. Armazenamento em FAISS (cache local)
   ↓
6. Busca semântica (similarity search)
   ↓
7. Contexto enviado para Groq API
   ↓
8. Resposta gerada pelo LLM
```

### 6.2 Configurações do RAG

**Modelo de Embeddings:**
```python
model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
# Alternativa mais leve que o mpnet-base-v2
# Suporta português
```

**Chunking:**
```python
chunk_size = 600          # Tamanho do chunk
chunk_overlap = 150       # Sobreposição
separators = ["\n\n", "\n", ". ", " ", ""]
```

**Busca:**
```python
similarity_search_k = 50  # Top-K documentos por similaridade
score_threshold = 8.0     # Limiar de relevância
max_context_docs = 20     # Máximo de docs no contexto
```

**LLM (Groq):**
```python
model = "llama-3.3-70b-versatile"
temperature = 0.1         # Respostas mais determinísticas
```

### 6.3 Cache

O sistema mantém cache local para evitar reprocessamento:

- `cache_faiss.index/` - Índice vetorial FAISS
- `cache_store.pkl` - Docstore serializado

**Limpar cache (se necessário):**
```bash
rm -rf python_rag/cache_faiss.index
rm python_rag/cache_store.pkl
```

---

## 7. VARIÁVEIS DE AMBIENTE

### backend/.env
```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
# String de conexão completa do MongoDB Atlas

# Groq API
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
# Chave da API Groq (gratuita)

# Servidor
PORT=3000
# Porta do servidor Express

NODE_ENV=development
# Ambiente: development | production
```

### python_rag/.env (opcional)
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
# Mesma chave do backend
```

---

## 8. DOCKER (Opcional)

### 8.1 Dockerfile Otimizado
```dockerfile
FROM node:18-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY python_rag/requirements.txt ./python_rag/
RUN pip install --no-cache-dir -r python_rag/requirements.txt \
    && rm -rf /root/.cache/pip

COPY . .

CMD ["node", "index.js"]
```

### 8.2 .dockerignore
```
node_modules
npm-debug.log
.env
.git
.gitignore
*.md
__pycache__
*.pyc
.venv
venv
.pytest_cache
python_rag/cache_*
```

### 8.3 Build e Run
```bash
# Build
docker build -t cpm-sistema .

# Run
docker run -p 3000:3000 --env-file backend/.env cpm-sistema
```

---

## 9. TESTES

### 9.1 Testes Manuais do Backend

**Teste de conexão:**
```bash
curl http://localhost:3000/
```

**Teste de inscrição:**
```bash
curl -X POST http://localhost:3000/api/inscricoes \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCompleto": "Teste Silva",
    "dataNascimento": "2000-01-01",
    "cpf": "12345678900",
    "email": "teste@email.com",
    "telefone": "81999999999",
    "menorIdade": false
  }'
```

**Teste do chat:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"mensagem": "Qual o prazo para matrícula?"}'
```

### 9.2 Testes do Python RAG
```bash
cd python_rag
python agente_cpm.py "Quais documentos são necessários?"
```

---

## 10. TROUBLESHOOTING

### 10.1 Problemas Comuns

**Erro: "Cannot find module 'express'"**
```bash
# Solução: reinstalar dependências
npm install
```

**Erro: "MongoDB connection failed"**
```bash
# Verificar:
# 1. String de conexão no .env está correta
# 2. IP está liberado no MongoDB Atlas
# 3. Credenciais corretas
```

**Erro: "GROQ_API_KEY não configurada"**
```bash
# Solução: criar arquivo .env com a chave
echo "GROQ_API_KEY=sua_chave" >> backend/.env
```

**Erro: "ModuleNotFoundError: No module named 'langchain'"**
```bash
# Solução: ativar venv e instalar
cd python_rag
.\venv\Scripts\activate
pip install -r requirements.txt
```

**RAG muito lento na primeira execução**
```
# Normal: está baixando o modelo de embeddings
# Próximas execuções usarão cache e serão rápidas
```

### 10.2 Logs

**Backend logs:**
```bash
# O Express mostra logs no console
# Erros aparecem com stack trace completo
```

**Python RAG logs:**
```bash
# stderr mostra progresso do carregamento
# stdout mostra apenas a resposta final
```

---

## 11. MANUTENÇÃO

### 11.1 Atualizar Editais
```bash
# 1. Adicionar novos PDFs em python_rag/dados/
# 2. Limpar cache
rm -rf python_rag/cache_*
# 3. Reiniciar backend (recarrega automaticamente)
```

### 11.2 Backup do Banco
```bash
# MongoDB Atlas faz backup automático
# Para backup manual:
mongodump --uri="sua_connection_string"
```

### 11.3 Monitoramento

- MongoDB Atlas Dashboard: métricas de uso
- Groq Console: uso da API
- Logs do servidor: erros e requests

---

## 12. SEGURANÇA

### 12.1 Boas Práticas Implementadas

- ✅ Variáveis sensíveis em .env (não versionadas)
- ✅ Validação de CPF e email
- ✅ CORS configurado
- ✅ Sanitização de inputs
- ✅ Mongoose schema validation

### 12.2 Recomendações Adicionais para Produção

- [ ] HTTPS obrigatório
- [ ] Rate limiting
- [ ] Autenticação/Autorização
- [ ] Logs estruturados
- [ ] Monitoring (Sentry, New Relic)
- [ ] Backup automatizado

---

## 13. PERFORMANCE

### 13.1 Otimizações Implementadas

- Cache FAISS para embeddings
- Índices MongoDB
- Chunking otimizado
- npm ci em produção
- Docker multi-stage build

### 13.2 Métricas Esperadas

- Tempo de resposta API: < 200ms
- Tempo RAG (cold start): 5-10s
- Tempo RAG (com cache): 2-3s
- Tamanho Docker image: 2-3GB

---

**Repositório:** https://github.com/pollyanasousa/projeto-final-ppe2.git


