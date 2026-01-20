// =====================================================
//  AGENTE.JS – Endpoint do Assistente IA (RAG + GROQ)
// =====================================================

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');

// =====================================================
//  CORS – permitir acesso do front
router.use(cors({ origin: '*' }));

// =====================================================
//  Caminho do script Python - ajustado para estrutura do Railway
const scriptPath = path.resolve(__dirname, '../../python_rag/agente_cpm.py');

// =====================================================
//  Executável Python
const pythonExecutable = 'python3';

console.log('[AGENTE] Python em uso:', pythonExecutable);
console.log('[AGENTE] Script carregado:', scriptPath);

// =====================================================
//  Rota principal – consulta ao RAG
router.post('/agente-consultar', async (req, res) => {
    try {
        const pergunta = req.body?.pergunta;
        if (!pergunta || typeof pergunta !== 'string' || pergunta.trim().length < 2) {
            return res.status(400).json({ sucesso: false, erro: 'Pergunta inválida ou muito curta' });
        }

        console.log('[AGENTE] Nova pergunta:', pergunta);

        const processo = spawn(pythonExecutable, [scriptPath, pergunta], {
            windowsHide: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
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
            console.log(`[AGENTE] Processo Python fechado (código ${code})`);
            if (res.headersSent) return;

            const respostaPronta = stdoutFull.trim();
            if (code === 0 && respostaPronta) {
                return res.json({ sucesso: true, resposta: respostaPronta });
            }

            console.error('[AGENTE] Erro ou saída vazia');
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
                    erro: 'Falha ao iniciar o assistente. Verifique a configuração do Python.'
                });
            }
        });

        // Timeout de segurança – 90s
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