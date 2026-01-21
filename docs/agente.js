// =====================================================
// AGENTE.JS - ASSISTENTE CPM (FRONTEND) COM HISTÓRICO
// =====================================================

const agenteBtn = document.getElementById('agente-btn');
const agenteChat = document.getElementById('agente-chat');
const agenteFechar = document.getElementById('agente-fechar');
const agenteMessages = document.getElementById('agente-messages');
const agenteInput = document.getElementById('agente-input');
const agenteEnviar = document.getElementById('agente-enviar');

// Histórico da conversa
let historicoConversa = [];
let aguardandoResposta = false;

const MENSAGEM_INICIAL = `Olá! Sou o Assistente do Conservatório de Música de Pernambuco.

Posso esclarecer dúvidas sobre o Processo Seletivo 2026.1:
- Resultados de aprovados e remanejados
- Documentação necessária para matrícula
- Vagas disponíveis por instrumento e turno
- Prazos de matrícula e início das aulas
- Valores de taxa e mensalidade
- Requisitos de idade e conhecimento prévio

Como posso ajudar?`;

const SUGESTOES = [
    "A inscrição 307897 foi aprovada?",
    "Quais documentos para matrícula?",
    "Tem vaga para piano turno noite?",
    "Qual o prazo para matrícula?"
];

const AGENTE_API_URL = 'http://localhost:3000';// URL do backend no Render

function inicializarAgente() {
    adicionarMensagemBot(MENSAGEM_INICIAL, true);

    agenteBtn.addEventListener('click', abrirChat);
    agenteFechar.addEventListener('click', fecharChat);
    agenteEnviar.addEventListener('click', enviarPergunta);

    agenteInput.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !aguardandoResposta) enviarPergunta();
    });

    agenteMessages.addEventListener('click', e => {
        if (e.target.classList.contains('sugestao-btn')) {
            agenteInput.value = e.target.textContent;
            enviarPergunta();
        }
    });
}

function abrirChat() { 
    agenteChat.classList.remove('hidden'); 
    agenteInput.focus(); 
}

function fecharChat() { 
    agenteChat.classList.add('hidden'); 
}

function adicionarMensagemBot(texto, comSugestoes = false) {
    const div = document.createElement('div');
    div.className = 'message-bot';

    const header = document.createElement('div');
    header.className = 'message-bot-header';
    header.textContent = 'Assistente CPM';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-bot-text';
    textDiv.textContent = texto;

    div.appendChild(header);
    div.appendChild(textDiv);

    if (comSugestoes) {
        const sugDiv = document.createElement('div');
        sugDiv.className = 'sugestoes';
        SUGESTOES.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'sugestao-btn';
            btn.textContent = s;
            sugDiv.appendChild(btn);
        });
        div.appendChild(sugDiv);
    }

    agenteMessages.appendChild(div);
    scrollParaFinal();
}

function adicionarMensagemUsuario(texto) {
    const div = document.createElement('div');
    div.className = 'message-user';
    const inner = document.createElement('div');
    inner.className = 'message-user-text';
    inner.textContent = texto;
    div.appendChild(inner);
    agenteMessages.appendChild(div);
    scrollParaFinal();
}

function mostrarLoading() {
    const loading = document.createElement('div');
    loading.className = 'message-loading';
    loading.id = 'agente-loading';

    const dots = document.createElement('div');
    dots.className = 'loading-dots';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'loading-dot';
        dots.appendChild(dot);
    }

    const text = document.createElement('span');
    text.textContent = 'Consultando documentos...';
    text.style.fontSize = '13px';
    text.style.color = '#666';

    loading.appendChild(dots);
    loading.appendChild(text);
    agenteMessages.appendChild(loading);
    scrollParaFinal();
}

function removerLoading() {
    const loading = document.getElementById('agente-loading');
    if (loading) loading.remove();
}

function scrollParaFinal() {
    agenteMessages.scrollTop = agenteMessages.scrollHeight;
}

function montarPerguntaComContexto(perguntaAtual) {
    if (historicoConversa.length === 0) return perguntaAtual;

    const ultimasMensagens = historicoConversa.slice(-3);
    let contextoCompleto = '';
    for (let msg of ultimasMensagens) {
        contextoCompleto += msg.role === 'user'
            ? `Usuário perguntou: ${msg.content}\n`
            : `Assistente respondeu: ${msg.content}\n`;
    }
    contextoCompleto += `\nNova pergunta do usuário: ${perguntaAtual}`;
    return contextoCompleto;
}

async function enviarPergunta() {
    const pergunta = agenteInput.value.trim();
    if (!pergunta || aguardandoResposta) return;

    aguardandoResposta = true;
    agenteInput.disabled = true;
    agenteEnviar.disabled = true;

    adicionarMensagemUsuario(pergunta);
    agenteInput.value = '';
    mostrarLoading();

    historicoConversa.push({ role: 'user', content: pergunta });

    try {
        const perguntaComContexto = montarPerguntaComContexto(pergunta);

        const response = await fetch(`${AGENTE_API_URL}/api/agente-consultar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pergunta: perguntaComContexto })
        });

        removerLoading();

        if (!response.ok) throw new Error('Erro na API');

        const data = await response.json();

        if (data.sucesso) {
            adicionarMensagemBot(data.resposta);
            historicoConversa.push({ role: 'assistant', content: data.resposta });

            if (historicoConversa.length > 10)
                historicoConversa = historicoConversa.slice(-10);

        } else {
            adicionarMensagemBot('Erro ao processar sua pergunta. Tente novamente.');
        }

    } catch (err) {
        removerLoading();
        adicionarMensagemBot('Falha de conexão com o servidor. Verifique se o backend está rodando.');
        console.error(err);
    }

    aguardandoResposta = false;
    agenteInput.disabled = false;
    agenteEnviar.disabled = false;
    agenteInput.focus();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAgente);
} else {
    inicializarAgente();
}

console.log('=== AGENTE CPM FRONTEND PRONTO PARA PRODUÇÃO ===');
