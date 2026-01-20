// =====================================================
// SERVER.JS - API BACKEND NODE.JS + EXPRESS + MONGODB
// =====================================================

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARE
// =====================================================

// Permite que o frontend se conecte de qualquer origem
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '2mb' }));

// Força UTF-8 em todas as respostas JSON
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// =====================================================
// SERVIR FRONTEND ESTÁTICO (OPCIONAL)
// =====================================================
// Se você quiser que o Node sirva o HTML, JS e CSS
// app.use(express.static(path.join(__dirname, '../frontend')));

let db;
let inadimplentesCollection;
let candidatosCollection;
let cursosCollection;

// =====================================================
// CONEXÃO MONGO DB ATLAS
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
        process.exit(1);
    }
};

// =====================================================
// ROTAS PRINCIPAIS
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
// ROTAS DO AGENTE (RAG + PYTHON)
// =====================================================
const agenteRoutes = require('./routes/agente');
app.use('/api', agenteRoutes);

// =====================================================
// VERIFICAR INADIMPLÊNCIA
// =====================================================
app.get('/api/verificar-inadimplencia', async (req, res) => {
    try {
        const { cpf } = req.query;

        if (!cpf) {
            return res.status(400).json({ sucesso: false, erro: 'CPF não informado' });
        }

        const cpfLimpo = cpf.replace(/\D/g, '');
        const inadimplente = await inadimplentesCollection.findOne({ cpf: cpfLimpo });

        if (inadimplente) {
            if (inadimplente.status === 'QUITADO') {
                return res.json({ sucesso: true, inadimplente: false, mensagem: 'Débito quitado' });
            }
            return res.json({ sucesso: true, inadimplente: true, dados: inadimplente });
        }

        return res.json({ sucesso: true, inadimplente: false, mensagem: 'CPF sem pendências' });
    } catch (error) {
        console.error('Erro ao verificar inadimplência:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor' });
    }
});

// =====================================================
// REGISTRAR MATRÍCULA
// =====================================================
app.post('/api/inscricao', async (req, res) => {
    try {
        const dados = req.body;
        const ano = new Date().getFullYear();
        const numero = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        const protocolo = `CONS-${ano}-${numero}`;

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

        const matriculasCollection = db.collection('matriculas');
        await matriculasCollection.insertOne(matricula);

        res.json({ sucesso: true, protocolo, mensagem: 'Matrícula registrada' });
    } catch (error) {
        console.error('Erro ao registrar matrícula:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro ao registrar matrícula' });
    }
});

// =====================================================
// LISTAR CURSOS
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
// INICIALIZAR SERVIDOR
// =====================================================
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
        console.log('⚠️ Certifique-se de que o frontend use fetch para localhost:3000 ou via proxy');
    });
};

startServer();
