// =====================================================
//  AGENTE.JS - Endpoint do Assistente IA (RAG + GROQ)
// =====================================================

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const os = require('os');

// =====================================================
//  CORS - permitir acesso do front
router.use(cors({ origin: '*' }));

// =====================================================
//  Caminho do script Python
const scriptPath = path.resolve(__dirname, '../../python_rag/agente_cpm.py');

// =====================================================
//  Executável Python - detecção automática
let pythonExecutable;

if (os.platform() === 'win32') {
    // Windows: tentar venv primeiro, depois python global
    const venvPython = path.resolve(__dirname, '../../python_rag/venv/Scripts/python.exe');
    pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python';
} else {
    // Linux/Mac
    const venvPython = path.resolve(__dirname, '../../python_rag/venv/bin/python3');
    pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python3';
}

console.log('[AGENTE] Python em uso:', pythonExecutable);
console.log('[AGENTE] Script carregado:', scriptPath);
console.log('[AGENTE] Diretorio atual:', __dirname);

// =====================================================
//  Verificar se o script existe ao iniciar
if (!fs.existsSync(scriptPath)) {
    console.error('[AGENTE] ERRO: Script Python NAO encontrado em:', scriptPath);
} else {
    console.log('[AGENTE] Script Python encontrado');
}

// =====================================================
//  Rota principal - consulta ao RAG
router.post('/agente-consultar', async (req, res) => {
    try {
        const pergunta = req.body?.pergunta;
        if (!pergunta || typeof pergunta !== 'string' || pergunta.trim().length < 2) {
            return res.status(400).json({ sucesso: false, erro: 'Pergunta invalida ou muito curta' });
        }

        console.log('[AGENTE] Nova pergunta:', pergunta);

        // Verificar se script existe
        if (!fs.existsSync(scriptPath)) {
            console.error('[AGENTE] Script Python nao encontrado');
            return res.status(500).json({
                sucesso: false,
                erro: 'Script do assistente nao encontrado no servidor'
            });
        }

        const processo = spawn(pythonExecutable, [scriptPath, pergunta], {
            windowsHide: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
            cwd: path.resolve(__dirname, '../../python_rag')
        });

        let stdoutFull = '';
        let stderrFull = '';

        processo.stdout.on('data', data => {
            stdoutFull += data.toString('utf8');
            console.log('[AGENTE-STDOUT]', data.toString('utf8').trim());
        });

        processo.stderr.on('data', data => {
            const msg = data.toString('utf8').trim();
            stderrFull += msg + '\n';
            console.log('[AGENTE-STDERR]', msg);
        });

        processo.on('close', code => {
            console.log(`[AGENTE] Processo Python fechado (codigo ${code})`);
            if (res.headersSent) return;

            const respostaPronta = stdoutFull.trim();
            
            // Se código 0 e tem resposta, sucesso
            if (code === 0 && respostaPronta) {
                return res.json({ sucesso: true, resposta: respostaPronta });
            }

            // Se falhou, mostrar detalhes
            console.error('[AGENTE] Erro ou saida vazia');
            console.error('[AGENTE-STDERR]', stderrFull);
            console.error('[AGENTE-STDOUT]', stdoutFull);

            return res.status(500).json({
                sucesso: false,
                erro: 'Erro ao processar a consulta.',
                detalhes: stderrFull || 'Sem detalhes de erro',
                stdout: stdoutFull || 'Sem saída'
            });
        });

        processo.on('error', err => {
            if (!res.headersSent) {
                console.error('[AGENTE] Falha ao iniciar Python:', err);
                return res.status(500).json({
                    sucesso: false,
                    erro: 'Falha ao iniciar o assistente Python.',
                    detalhes: err.message
                });
            }
        });

        // Timeout de seguranca - 90s
        setTimeout(() => {
            if (!res.headersSent) {
                processo.kill('SIGKILL');
                console.log('[AGENTE] Processo encerrado por timeout (90s)');
                return res.status(504).json({
                    sucesso: false,
                    erro: 'Tempo limite excedido. O assistente demorou demais para responder.'
                });
            }
        }, 90000);

    } catch (error) {
        console.error('[AGENTE] Erro inesperado:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                sucesso: false, 
                erro: 'Erro interno do servidor.',
                detalhes: error.message
            });
        }
    }
});

module.exports = router;