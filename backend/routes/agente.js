// =====================================================
//  AGENTE.JS — Endpoint do Assistente IA (RAG + GROQ)
// -----------------------------------------------------
//  Este módulo integra o backend Node.js ao script Python
//  responsável por executar o RAG (busca + embeddings +
//  modelo da Groq). A rota POST /api/agente-consultar
//  recebe uma pergunta e devolve a resposta gerada pelo
//  pipeline em Python.
// =====================================================

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// =====================================================
//  CAMINHOS DO PYTHON E DO SCRIPT DO RAG
// -----------------------------------------------------
//  Localiza automaticamente o executável do Python dentro
//  da venv, tanto no Windows quanto em Linux. Esse Python
//  é quem executa o arquivo agente_cpm.py.
// =====================================================

// Caminho do script Python do RAG
const scriptPath = path.resolve(__dirname, '../../python_rag/agente_cpm.py');

// Seleção do executável Python dentro da venv
const pythonExecutable =
    process.platform === 'win32'
        ? path.resolve(__dirname, '../../python_rag/venv/Scripts/python.exe')
        : path.resolve(__dirname, '../../python_rag/venv/bin/python');

// Logs de diagnóstico (úteis para deploy)
console.log('[AGENTE] Python em uso:', pythonExecutable);
console.log('[AGENTE] Script carregado:', scriptPath);

// =====================================================
//  ROTA PRINCIPAL — EXECUÇÃO DO ASSISTENTE
// -----------------------------------------------------
//  Recebe uma pergunta do usuário e inicia um processo
//  Python para rodar o pipeline RAG. Toda comunicação com
//  o Python é feita via STDOUT (resposta) e STDERR (erros).
// =====================================================

router.post('/agente-consultar', async (req, res) => {
    try {
        const pergunta = req.body?.pergunta;

        // Validação simples e robusta da entrada
        if (!pergunta || typeof pergunta !== 'string' || pergunta.trim().length < 2) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Pergunta inválida ou muito curta'
            });
        }

        console.log('[AGENTE] Nova pergunta recebida:', pergunta);

        // -----------------------------------------------------
        //  Inicialização do processo Python
        //  Usamos spawn para permitir streaming de logs
        // -----------------------------------------------------
        const processo = spawn(pythonExecutable, [scriptPath, pergunta], {
            windowsHide: true,
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });

        let stdoutFull = ''; // resposta final da IA
        let stderrFull = ''; // erros e logs do Python

        // -----------------------------------------------------
        //  STDOUT — resposta produzida pelo script Python
        // -----------------------------------------------------
        processo.stdout.on('data', data => {
            const texto = data.toString('utf8');
            stdoutFull += texto;
            console.log('[AGENTE-STDOUT]', texto.trim());
        });

        // -----------------------------------------------------
        //  STDERR — logs, avisos e erros do Python
        // -----------------------------------------------------
        processo.stderr.on('data', data => {
            const msg = data.toString('utf8').trim();
            stderrFull += msg + '\n';
            console.log('[AGENTE-STDERR]', msg);
        });

        // -----------------------------------------------------
        //  Finalização do processo Python
        // -----------------------------------------------------
        processo.on('close', code => {
            console.log(`[AGENTE] Processo Python fechado (código ${code})`);
            if (res.headersSent) return;

            const respostaPronta = stdoutFull.trim();

            // Caso tudo tenha ido bem
            if (code === 0 && respostaPronta) {
                return res.json({
                    sucesso: true,
                    resposta: respostaPronta
                });
            }

            // Caso o script finalize sem erro mas sem resposta
            console.error('[AGENTE] Erro: saída vazia ou código != 0');
            console.error('[AGENTE-STDERR]', stderrFull);
            console.error('[AGENTE-STDOUT]', stdoutFull);

            return res.status(500).json({
                sucesso: false,
                erro: 'Erro ao processar a consulta. Verifique os logs do servidor.'
            });
        });

        // -----------------------------------------------------
        //  Tratamento de erro ao iniciar o processo Python
        // -----------------------------------------------------
        processo.on('error', err => {
            if (!res.headersSent) {
                console.error('[AGENTE] Falha ao iniciar Python:', err);
                return res.status(500).json({
                    sucesso: false,
                    erro: 'Falha ao iniciar o assistente. Verifique a configuração do Python.'
                });
            }
        });

        // -----------------------------------------------------
        //  TIMEOUT — segurança para evitar travamento do servidor
        // -----------------------------------------------------
        //  Como o primeiro carregamento do RAG é pesado, o tempo
        //  limite foi definido em 90s.
// -----------------------------------------------------
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
        // -----------------------------------------------------
        //  Fallback para erros não tratados
        // -----------------------------------------------------
        console.error('[AGENTE] Erro inesperado:', error);
        if (!res.headersSent) {
            res.status(500).json({
                sucesso: false,
                erro: 'Erro interno do servidor.'
            });
        }
    }
});

module.exports = router;
