// =====================================================
//  AGENTE.JS - Endpoint do Assistente IA (RAG + GROQ)
// =====================================================

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// =====================================================
//  CORS - permitir acesso do front
router.use(cors({ origin: '*' }));

// =====================================================
//  Caminho do script Python
//  De: backend/routes/ -> python_rag/agente_cpm.py
//  __dirname e backend/routes/
//  Subimos 2 niveis: ../../ = raiz do projeto
//  Depois: python_rag/agente_cpm.py
const scriptPath = path.resolve(__dirname, '../../python_rag/agente_cpm.py');

// =====================================================
//  Executavel Python
const pythonExecutable = 'python3';

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
            if (code === 0 && respostaPronta) {
                return res.json({ sucesso: true, resposta: respostaPronta });
            }

            console.error('[AGENTE] Erro ou saida vazia');
            console.error('[AGENTE-STDERR]', stderrFull);
            console.error('[AGENTE-STDOUT]', stdoutFull);

            return res.status(500).json({
                sucesso: false,
                erro: 'Erro ao processar a consulta. Verifique os logs do servidor.'
            });
        });

        processo.on('error', err => {
            if (!res.headersSent) {
                console.error('[AGENTE] Falha ao iniciar Python:', err);
                return res.status(500).json({
                    sucesso: false,
                    erro: 'Falha ao iniciar o assistente. Verifique a configuracao do Python.'
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
            res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor.' });
        }
    }
});

module.exports = router;