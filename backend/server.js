// =====================================================
//  SERVER.JS  —  Backend Node.js + Express + MongoDB
//  Este servidor expõe a API usada pelo Conservatório PE,
//  incluindo: consulta ao agente (RAG Python), verificação
//  de inadimplência, listagem de cursos e registro de matrículas.
// =====================================================

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
//  MIDDLEWARES
// =====================================================

// Configura CORS para permitir acesso do frontend
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Permite JSON no corpo das requisições
app.use(express.json({ limit: '2mb' }));

// Garante que todas respostas JSON usem UTF-8
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// -----------------------------------------------------
// Caso no futuro você queira servir o frontend pelo Node,
// basta descomentar a linha abaixo.
// -----------------------------------------------------
// app.use(express.static(path.join(__dirname, '../frontend')));

// =====================================================
//  VARIÁVEIS GLOBAIS DO BANCO
// =====================================================
let db;
let inadimplentesCollection;
let candidatosCollection;
let cursosCollection;

// =====================================================
//  CONEXÃO COM O MONGO DB ATLAS
// =====================================================
//  Estabelece conexão com o cluster e inicializa as coleções.
// =====================================================
const connectDB = async () => {
    try {
        const client = await MongoClient.connect(process.env.MONGO_URI);
        console.log('Conectado ao MongoDB Atlas');

        db = client.db('conservatorio_db');
        inadimplentesCollection = db.collection('inadimplentes');
        candidatosCollection = db.collection('candidatos');
        cursosCollection = db.collection('cursos');

    } catch (error) {
        console.error('Erro ao conectar no MongoDB:', error);
        process.exit(1); // Encerra o servidor se o banco não conectar
    }
};

// =====================================================
//  ROTA DE STATUS DA API
// =====================================================
//  Serve como endpoint de diagnóstico para verificar se a API
//  está online e listar os serviços disponíveis.
// =====================================================
app.get('/', (req, res) => {
    res.json({
        message: 'API Conservatório PE - Online',
        version: '1.1.0',
        endpoints: [
            'POST /api/agente-consultar',
            'GET /api/verificar-inadimplencia?cpf={cpf}',
            'POST /api/inscricao',
            'GET /api/cursos'
        ]
    });
});

// =====================================================
//  ROTAS DO AGENTE (RAG EM PYTHON)
// =====================================================
//  Aqui integramos o backend Node ao script Python que analisa
//  documentos do edital via modelo Groq.
// =====================================================
const agenteRoutes = require('./routes/agente');
app.use('/api', agenteRoutes);

// =====================================================
//  VERIFICAR INADIMPLÊNCIA
// =====================================================
//  Recebe um CPF e verifica no MongoDB se o candidato possui
//  pendências financeiras no Conservatório.
// =====================================================
app.get('/api/verificar-inadimplencia', async (req, res) => {
    try {
        const { cpf } = req.query;

        if (!cpf) {
            return res.status(400).json({ sucesso: false, erro: 'CPF não informado' });
        }

        const cpfLimpo = cpf.replace(/\D/g, '');
        const inadimplente = await inadimplentesCollection.findOne({ cpf: cpfLimpo });

        // Registro localizado
        if (inadimplente) {
            if (inadimplente.status === 'QUITADO') {
                return res.json({ sucesso: true, inadimplente: false, mensagem: 'Débito quitado' });
            }
            return res.json({ sucesso: true, inadimplente: true, dados: inadimplente });
        }

        // CPF sem pendências
        return res.json({ sucesso: true, inadimplente: false, mensagem: 'CPF sem pendências' });

    } catch (error) {
        console.error('Erro ao verificar inadimplência:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// =====================================================
//  REGISTRAR MATRÍCULA
// =====================================================
//  Registra a inscrição/matrícula de um aluno no banco,
//  gerando um protocolo único e salvando todos os dados
//  pessoais e do curso escolhido.
// =====================================================
app.post('/api/inscricao', async (req, res) => {
    try {
        const dados = req.body;

        // Geração do protocolo (ex: CONS-2026-01234)
        const ano = new Date().getFullYear();
        const numero = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        const protocolo = `CONS-${ano}-${numero}`;

        // Documento a ser salvo no banco
        const matricula = {
            protocolo,
            aluno: {
                cpf: dados.cpfCandidato?.replace(/\D/g, ''),
                nome: dados.nomeCompleto,
                dataNascimento: dados.dataNascimento,
                email: dados.email,
                telefone: dados.telefone
            },
            responsavel: dados.menorIdade === 'sim' ? {
                cpf: dados.cpfResponsavel?.replace(/\D/g, ''),
                nome: dados.nomeResponsavel,
                telefone: dados.telefone,
                parentesco: 'responsavel'
            } : null,
            endereco: {
                cep: dados.cep,
                logradouro: dados.logradouro,
                numero: dados.numero,
                complemento: dados.complemento || null,
                bairro: dados.bairro,
                cidade: dados.cidade,
                uf: dados.uf
            },
            curso: {
                instrumento: dados.instrumento,
                nivel: dados.nivelExperiencia,
                solicitaIsencao: dados.solicitaIsencao
            },
            status: 'ATIVA',
            dataMatricula: new Date().toISOString(),
            valorMensalidade: dados.solicitaIsencao ? 0 : 30.0,
            taxaMatricula: dados.solicitaIsencao ? 0 : 40.0
        };

        // Inserção no banco
        const matriculasCollection = db.collection('matriculas');
        await matriculasCollection.insertOne(matricula);

        res.json({ sucesso: true, protocolo, mensagem: 'Matrícula registrada' });

    } catch (error) {
        console.error('Erro ao registrar matrícula:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro ao registrar matrícula' });
    }
});

// =====================================================
//  LISTAR CURSOS DISPONÍVEIS
// =====================================================
//  Retorna apenas os cursos marcados como "ativo: true"
//  no banco de dados.
// =====================================================
app.get('/api/cursos', async (req, res) => {
    try {
        const cursos = await cursosCollection.find({ ativo: true }).toArray();
        res.json({ sucesso: true, cursos });
    } catch (error) {
        console.error('Erro ao listar cursos:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro ao buscar cursos' });
    }
});

// =====================================================
//  INICIALIZAÇÃO DO SERVIDOR
// =====================================================
//  Conecta ao banco e só depois inicia o servidor Express.
// =====================================================
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
};

startServer();
