// =====================================================
// AGENTE.JS - ROTA DO ASSISTENTE IA (RAG + GROQ)
// =====================================================
// CORREÇÕES APLICADAS:
// 1. Confirmado uso do venv principal (não venv_agente)
// 2. Melhor tratamento de erros
// 3. Logs mais detalhados para debug
// 4. Timeout ajustado para 90s (RAG pode demorar)
// =====================================================

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// =====================================================
// CAMINHOS DO PYTHON + SCRIPT
// =====================================================

// Script Python do RAG
const scriptPath = path.resolve(__dirname, '../../python_rag/agente_cpm.py');

// ✅ USANDO VENV PRINCIPAL (não venv_agente)
// Detecta Python da venv corretamente (Windows ou Linux)
const pythonExecutable =
    process.platform === 'win32'
        ? path.resolve(__dirname, '../../python_rag/venv/Scripts/python.exe')
        : path.resolve(__dirname, '../../python_rag/venv/bin/python');

// Log para conferência
console.log('[AGENTE] Python:', pythonExecutable);
console.log('[AGENTE] Script:', scriptPath);

// =====================================================
// ROTA PRINCIPAL DO ASSISTENTE
// =====================================================

router.post('/agente-consultar', async (req, res) => {
    try {
        const pergunta = req.body?.pergunta;

        // ✅ VALIDAÇÃO MELHORADA
        if (!pergunta || typeof pergunta !== 'string' || pergunta.trim().length < 2) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Pergunta inválida ou muito curta'
            });
        }

        console.log('[AGENTE] NOVA PERGUNTA:', pergunta);

        // ==============================
        // Executa Python como child process
        // ==============================
        const processo = spawn(pythonExecutable, [scriptPath, pergunta], {
            windowsHide: true,
            // ✅ Garante que encoding seja UTF-8
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });

        let stdoutFull = '';
        let stderrFull = '';

        // ✅ CAPTURA SAÍDA PADRÃO (resposta da IA)
        processo.stdout.on('data', data => {
            const texto = data.toString('utf8');
            stdoutFull += texto;
            console.log('[AGENTE-STDOUT]', texto.trim());
        });

        // ✅ CAPTURA ERROS DO PYTHON (logs de debug)
        processo.stderr.on('data', data => {
            const msg = data.toString('utf8').trim();
            stderrFull += msg + '\n';
            console.log('[AGENTE-STDERR]', msg);
        });

        // ==============================
        // FINALIZAÇÃO DO PROCESSO PYTHON
        // ==============================
        processo.on('close', code => {
            if (res.headersSent) return;

            console.log(`[AGENTE] Python finalizou com código ${code}`);

            // ✅ SUCESSO: Código 0 e resposta não vazia
            if (code === 0 && stdoutFull.trim() !== '') {
                return res.json({
                    sucesso: true,
                    resposta: stdoutFull.trim()
                });
            }

            // ❌ ERRO: Processo falhou ou resposta vazia
            console.error('[AGENTE] Python retornou erro ou saída vazia.');
            console.error('[AGENTE] STDERR:', stderrFull);
            console.error('[AGENTE] STDOUT:', stdoutFull);

            return res.status(500).json({
                sucesso: false,
                erro: 'Erro ao processar a consulta. Verifique os logs do servidor.'
            });
        });

        // ✅ ERRO: Falha ao iniciar processo
        processo.on('error', err => {
            if (!res.headersSent) {
                console.error('[AGENTE] ERRO AO INICIAR PYTHON:', err);
                return res.status(500).json({
                    sucesso: false,
                    erro: 'Falha ao iniciar o assistente. Verifique se o Python está configurado.'
                });
            }
        });

        // ==============================
        // TIMEOUT AJUSTADO: 90s
        // ==============================
        // RAG + embeddings + Groq podem demorar, especialmente no primeiro carregamento
        setTimeout(() => {
            if (!res.headersSent) {
                processo.kill('SIGKILL');
                console.log('[AGENTE] PROCESSO FINALIZADO POR TIMEOUT (90s)');

                return res.status(504).json({
                    sucesso: false,
                    erro: 'Tempo limite excedido. O assistente está demorando muito para responder.'
                });
            }
        }, 90000); // 90 segundos

    } catch (error) {
        console.error('[AGENTE] ERRO INTERNO:', error);

        if (!res.headersSent) {
            res.status(500).json({
                sucesso: false,
                erro: 'Erro interno do servidor.'
            });
        }
    }
});

module.exports = router;