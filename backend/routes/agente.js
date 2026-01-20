// =====================================================
//  AGENTE.JS – Endpoint do Assistente IA (GROQ)
// =====================================================

const express = require('express');
const router = express.Router();
const cors = require('cors');
const Groq = require('groq-sdk');

// =====================================================
//  CORS – permitir acesso do front
router.use(cors({ origin: '*' }));

// =====================================================
//  Inicializar cliente Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// =====================================================
//  Prompt do sistema
const SYSTEM_PROMPT = `Você é um assistente virtual do CPM Music, uma escola de música.

Suas responsabilidades:
- Ajudar alunos com dúvidas sobre matrículas
- Explicar quais documentos são necessários
- Informar sobre prazos de matrícula
- Esclarecer dúvidas sobre o processo seletivo
- Orientar sobre cursos e instrumentos disponíveis

Informações importantes:
- Matrícula: Necessário RG, CPF, comprovante de residência
- Prazo: Inscrições abertas até 28/02/2026
- Documentos para menores: É necessário documento do responsável
- Endereço: A escola fica em Recife, PE
- Instrumentos disponíveis: Piano, Violão, Guitarra, Bateria, Baixo, Canto

Seja sempre educado, claro e objetivo. Se não souber algo, seja honesto e sugira contato direto com a secretaria.`;

// =====================================================
//  Função para processar pergunta
async function processarPergunta(pergunta, historico = []) {
  try {
    console.log('[AGENTE] Processando pergunta:', pergunta);

    const mensagens = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      ...historico,
      {
        role: 'user',
        content: pergunta
      }
    ];

    const completion = await groq.chat.completions.create({
      messages: mensagens,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    const resposta = completion.choices[0].message.content;
    
    console.log('[AGENTE] Resposta gerada com sucesso');
    
    return {
      sucesso: true,
      resposta: resposta,
      tokens_usados: completion.usage.total_tokens
    };

  } catch (error) {
    console.error('[AGENTE] Erro ao processar pergunta:', error);
    
    if (error.status === 401) {
      return {
        sucesso: false,
        erro: 'Chave da API inválida',
        detalhes: 'Verifique a GROQ_API_KEY'
      };
    }
    
    if (error.status === 429) {
      return {
        sucesso: false,
        erro: 'Limite de requisições atingido',
        detalhes: 'Tente novamente em alguns segundos'
      };
    }
    
    return {
      sucesso: false,
      erro: 'Erro ao processar pergunta',
      detalhes: error.message
    };
  }
}

// =====================================================
//  Rota principal – consulta ao agente
router.post('/agente-consultar', async (req, res) => {
  try {
    const pergunta = req.body?.pergunta;
    
    if (!pergunta || typeof pergunta !== 'string' || pergunta.trim().length < 2) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Pergunta inválida ou muito curta' 
      });
    }

    console.log('[AGENTE] Nova pergunta:', pergunta);

    const historico = req.body?.historico || [];
    const resultado = await processarPergunta(pergunta, historico);
    
    if (resultado.sucesso) {
      res.json({
        sucesso: true,
        resposta: resultado.resposta,
        tokens: resultado.tokens_usados
      });
    } else {
      res.status(500).json({
        sucesso: false,
        erro: resultado.erro,
        detalhes: resultado.detalhes
      });
    }
    
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