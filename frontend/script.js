// =====================================================
// SCRIPT.JS - LÓGICA PRINCIPAL DO SISTEMA INTEGRADA
// =====================================================
// LOCAL: frontend/script.js
// FUNÇÃO: Controla apenas o FORMULÁRIO DE MATRÍCULA
// NÃO interfere no chat (agente.js)
// =====================================================

// ===== ELEMENTOS DO DOM (SÓ FORMULÁRIO) =====
const form = document.getElementById('inscricaoForm');
const alertBox = document.getElementById('alertBox');
const loading = document.getElementById('loading');
const menorIdadeSelect = document.getElementById('menorIdade');
const responsavelSection = document.getElementById('responsavelSection');
const pendenciaModal = document.getElementById('pendenciaModal');
const sucessoModal = document.getElementById('sucessoModal');

// Campos do formulário
const cpfCandidatoInput = document.getElementById('cpfCandidato');
const cpfResponsavelInput = document.getElementById('cpfResponsavel');
const cepInput = document.getElementById('cep');
const telefoneInput = document.getElementById('telefone');
const dataNascimentoInput = document.getElementById('dataNascimento');

// ===== FLAG DE CONTROLE (EVITA CONFLITO COM CHAT) =====
let form_processandoMatricula = false;

// ===== FORMATAÇÃO AUTOMÁTICA DOS CAMPOS =====
function formatarCampo(input, regexps) {
    input.addEventListener('input', e => {
        let valor = e.target.value.replace(/\D/g, '');
        regexps.forEach(([pattern, replace]) => valor = valor.replace(pattern, replace));
        e.target.value = valor;
    });
}

// CPF candidato
formatarCampo(cpfCandidatoInput, [
    [/(\d{3})(\d)/, '$1.$2'],
    [/(\d{3})(\d)/, '$1.$2'],
    [/(\d{3})(\d{1,2})$/, '$1-$2']
]);

// CPF responsável
formatarCampo(cpfResponsavelInput, [
    [/(\d{3})(\d)/, '$1.$2'],
    [/(\d{3})(\d)/, '$1.$2'],
    [/(\d{3})(\d{1,2})$/, '$1-$2']
]);

// CEP
formatarCampo(cepInput, [[/(\d{5})(\d)/, '$1-$2']]);

// Telefone
telefoneInput.addEventListener('input', e => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
        if (valor.length <= 10) {
            valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
            valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
            valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = valor;
    }
});

// ===== CONTROLE DE MENOR DE IDADE =====
menorIdadeSelect.addEventListener('change', () => {
    if (menorIdadeSelect.value === 'sim') {
        responsavelSection.style.display = 'block';
        document.getElementById('nomeResponsavel').required = true;
        document.getElementById('cpfResponsavel').required = true;
    } else {
        responsavelSection.style.display = 'none';
        document.getElementById('nomeResponsavel').required = false;
        document.getElementById('cpfResponsavel').required = false;
        document.getElementById('nomeResponsavel').value = '';
        document.getElementById('cpfResponsavel').value = '';
    }
});

// ===== CONSULTA DE CEP (Brasil API) =====
cepInput.addEventListener('blur', async function () {
    const cep = this.value.replace(/\D/g, '');
    if (cep.length === 8) {
        form_mostrarLoading('Consultando CEP...');
        const resultado = await consultarCEP(cep);
        form_esconderLoading();
        
        if (resultado.sucesso) {
            document.getElementById('logradouro').value = resultado.dados.logradouro;
            document.getElementById('bairro').value = resultado.dados.bairro;
            document.getElementById('cidade').value = resultado.dados.cidade;
            document.getElementById('uf').value = resultado.dados.uf;
            mostrarAlerta('CEP encontrado! Endereço preenchido automaticamente.', 'success');
        } else {
            mostrarAlerta('CEP não encontrado. Preencha o endereço manualmente.', 'warning');
            document.getElementById('logradouro').value = '';
            document.getElementById('bairro').value = '';
            document.getElementById('cidade').value = '';
            document.getElementById('uf').value = '';
        }
    }
});

// ===== VALIDAÇÃO DE IDADE =====
dataNascimentoInput.addEventListener('blur', () => {
    const data = new Date(dataNascimentoInput.value);
    const hoje = new Date();
    let idade = hoje.getFullYear() - data.getFullYear();
    if (hoje.getMonth() < data.getMonth() || (hoje.getMonth() === data.getMonth() && hoje.getDate() < data.getDate())) idade--;
    
    if (idade < 18) {
        menorIdadeSelect.value = 'sim';
        responsavelSection.style.display = 'block';
        document.getElementById('nomeResponsavel').required = true;
        document.getElementById('cpfResponsavel').required = true;
        mostrarAlerta('Candidato menor de 18 anos. Informe os dados do responsável.', 'info');
    } else {
        menorIdadeSelect.value = 'nao';
        responsavelSection.style.display = 'none';
        document.getElementById('nomeResponsavel').required = false;
        document.getElementById('cpfResponsavel').required = false;
    }
});

// ===== SUBMISSÃO DO FORMULÁRIO =====
form.addEventListener('submit', async e => {
    e.preventDefault();
    
    // ATIVA FLAG (para evitar conflito com chat)
    form_processandoMatricula = true;
    
    if (!validarFormulario()) {
        form_processandoMatricula = false;
        return;
    }
    
    const dados = coletarDadosFormulario();
    form_mostrarLoading('Verificando cadastro no sistema...');

    try {
        const resultadoCandidato = await verificarInadimplencia(dados.cpfCandidato);
        
        if (resultadoCandidato.inadimplente) {
            form_esconderLoading();
            mostrarModalPendencia(resultadoCandidato.dados);
            form_processandoMatricula = false;
            return;
        }

        if (dados.menorIdade === 'sim') {
            const resultadoResponsavel = await verificarInadimplencia(dados.cpfResponsavel);
            
            if (resultadoResponsavel.inadimplente) {
                form_esconderLoading();
                mostrarModalPendencia(resultadoResponsavel.dados);
                form_processandoMatricula = false;
                return;
            }
        }

        const resultadoInscricao = await registrarInscricao(dados);
        form_esconderLoading();

        if (resultadoInscricao.sucesso) {
            mostrarModalSucesso(resultadoInscricao.protocolo);
            limparFormulario();
        } else {
            mostrarAlerta('Erro ao registrar inscrição. Tente novamente.', 'danger');
        }
        
    } catch (err) {
        form_esconderLoading();
        mostrarAlerta('Erro ao processar inscrição. Tente novamente mais tarde.', 'danger');
        console.error('[FORM] Erro:', err);
    } finally {
        form_processandoMatricula = false;
    }
});

// ===== VALIDAÇÃO DE FORMULÁRIO =====
function validarFormulario() {
    if (!validarFormatoCPF(cpfCandidatoInput.value)) {
        mostrarAlerta('CPF do candidato inválido!', 'danger');
        cpfCandidatoInput.focus();
        return false;
    }
    
    if (menorIdadeSelect.value === 'sim' && !validarFormatoCPF(cpfResponsavelInput.value)) {
        mostrarAlerta('CPF do responsável inválido!', 'danger');
        cpfResponsavelInput.focus();
        return false;
    }
    
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) {
        mostrarAlerta('CEP inválido!', 'danger');
        cepInput.focus();
        return false;
    }
    
    const tel = telefoneInput.value.replace(/\D/g, '');
    if (tel.length < 10) {
        mostrarAlerta('Telefone inválido!', 'danger');
        telefoneInput.focus();
        return false;
    }
    
    return true;
}

// ===== AUXILIARES =====
function coletarDadosFormulario() {
    return {
        nomeCompleto: document.getElementById('nomeCompleto').value,
        dataNascimento: dataNascimentoInput.value,
        cpfCandidato: cpfCandidatoInput.value,
        menorIdade: menorIdadeSelect.value,
        nomeResponsavel: document.getElementById('nomeResponsavel').value,
        cpfResponsavel: cpfResponsavelInput.value,
        email: document.getElementById('email').value,
        telefone: telefoneInput.value,
        cep: cepInput.value,
        logradouro: document.getElementById('logradouro').value,
        numero: document.getElementById('numero').value,
        complemento: document.getElementById('complemento').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        uf: document.getElementById('uf').value,
        instrumento: document.getElementById('instrumento').value,
        nivelExperiencia: document.getElementById('nivelExperiencia').value,
        solicitaIsencao: document.getElementById('solicitaIsencao').checked,
        dataInscricao: new Date().toISOString(),
        status: 'PENDENTE'
    };
}

function limparFormulario() {
    form.reset();
    responsavelSection.style.display = 'none';
}

// ===== INTERFACE (PREFIXO form_ PARA EVITAR CONFLITO) =====
function mostrarAlerta(msg, tipo) {
    alertBox.className = `alert alert-${tipo} show`;
    alertBox.textContent = msg;
    setTimeout(() => alertBox.classList.remove('show'), 5000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function form_mostrarLoading(msg = 'Processando...') {
    // SÓ MOSTRA SE FOR PROCESSO DE MATRÍCULA
    if (!form_processandoMatricula) return;
    
    loading.querySelector('p').textContent = msg;
    loading.classList.add('show');
    form.style.display = 'none';
}

function form_esconderLoading() {
    loading.classList.remove('show');
    form.style.display = 'block';
}

function mostrarModalPendencia(dados) {
    const debtDetails = document.getElementById('debtDetails');
    let html = '';
    dados.debitos.forEach(d => html += `<div class="debt-item"><span>${d.descricao}</span><span>R$ ${d.valor.toFixed(2)}</span></div>`);
    html += `<div class="debt-item"><span><strong>TOTAL A QUITAR</strong></span><span><strong>R$ ${dados.totalDevido.toFixed(2)}</strong></span></div>`;
    debtDetails.innerHTML = html;
    pendenciaModal.classList.add('show');
}

function fecharModal() {
    pendenciaModal.classList.remove('show');
    limparFormulario();
}

function mostrarModalSucesso(protocolo) {
    document.getElementById('protocoloNumero').textContent = protocolo;
    sucessoModal.classList.add('show');
}

function fecharModalSucesso() {
    sucessoModal.classList.remove('show');
    limparFormulario();
}

console.log('✅ SCRIPT FRONTEND INTEGRADO PRONTO (ISOLADO)');