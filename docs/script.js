// =====================================================
//  SCRIPT.JS - Lógica do formulário de matrícula
//  VERSÃO COM DEBUG PARA MODAL DE INADIMPLÊNCIA
// =====================================================

const form = document.getElementById('inscricaoForm');
const alertBox = document.getElementById('alertBox');
const loading = document.getElementById('loading');
const menorIdadeSelect = document.getElementById('menorIdade');
const responsavelSection = document.getElementById('responsavelSection');
const pendenciaModal = document.getElementById('pendenciaModal');
const sucessoModal = document.getElementById('sucessoModal');

const cpfCandidatoInput = document.getElementById('cpfCandidato');
const cpfResponsavelInput = document.getElementById('cpfResponsavel');
const cepInput = document.getElementById('cep');
const telefoneInput = document.getElementById('telefone');
const dataNascimentoInput = document.getElementById('dataNascimento');

let form_processandoMatricula = false;

// =====================================================
//  FORMATAÇÃO AUTOMÁTICA DE CAMPOS
// =====================================================
function formatarCampo(input, regexps) {
    input.addEventListener('input', e => {
        let valor = e.target.value.replace(/\D/g, '');
        regexps.forEach(([pattern, replace]) => valor = valor.replace(pattern, replace));
        e.target.value = valor;
    });
}

formatarCampo(cpfCandidatoInput, [
    [/(\d{3})(\d)/, '$1.$2'],
    [/(\d{3})(\d)/, '$1.$2'],
    [/(\d{3})(\d{1,2})$/, '$1-$2']
]);

formatarCampo(cpfResponsavelInput, [
    [/(\d{3})(\d)/, '$1.$2'],
    [/(\d{3})(\d)/, '$1.$2'],
    [/(\d{3})(\d{1,2})$/, '$1-$2']
]);

formatarCampo(cepInput, [[/(\d{5})(\d)/, '$1-$2']]);

telefoneInput.addEventListener('input', e => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
        valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
        valor = valor.replace(
            valor.length <= 10 ? /(\d{4})(\d)/ : /(\d{5})(\d)/,
            '$1-$2'
        );
        e.target.value = valor;
    }
});

// =====================================================
//  EXIBIÇÃO CONDICIONAL DE CAMPOS DO RESPONSÁVEL
// =====================================================
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

// =====================================================
//  CONSULTA DE CEP
// =====================================================
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
            mostrarAlerta('CEP encontrado. Endereço preenchido automaticamente.', 'success');
        } else {
            mostrarAlerta('CEP não encontrado. Preencha o endereço manualmente.', 'warning');
            document.getElementById('logradouro').value = '';
            document.getElementById('bairro').value = '';
            document.getElementById('cidade').value = '';
            document.getElementById('uf').value = '';
        }
    }
});

// =====================================================
//  VALIDAÇÃO DE IDADE DO CANDIDATO
// =====================================================
dataNascimentoInput.addEventListener('blur', () => {
    const data = new Date(dataNascimentoInput.value);
    const hoje = new Date();

    let idade = hoje.getFullYear() - data.getFullYear();
    if (
        hoje.getMonth() < data.getMonth() ||
        (hoje.getMonth() === data.getMonth() && hoje.getDate() < data.getDate())
    ) {
        idade--;
    }

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

// =====================================================
//  SUBMISSÃO DO FORMULÁRIO - VERSÃO COM DEBUG
// =====================================================
form.addEventListener('submit', async e => {
    e.preventDefault();

    console.log('========================================');
    console.log('INÍCIO DO PROCESSO DE MATRÍCULA');
    console.log('========================================');

    form_processandoMatricula = true;

    if (!validarFormulario()) {
        console.log('ERRO: Validação de formulário falhou');
        form_processandoMatricula = false;
        return;
    }

    const dados = coletarDadosFormulario();
    console.log('Dados coletados:', dados);

    form_mostrarLoading('Verificando cadastro no sistema...');

    try {
        // ==========================================
        // VERIFICAR INADIMPLÊNCIA DO CANDIDATO
        // ==========================================
        console.log('Verificando inadimplência do candidato:', dados.cpfCandidato);
        
        const resultadoCandidato = await verificarInadimplencia(dados.cpfCandidato);
        
        console.log('Resultado da verificação (candidato):', resultadoCandidato);

        // DEBUG: Verificar estrutura da resposta
        if (resultadoCandidato.inadimplente) {
            console.log('INADIMPLENTE DETECTADO!');
            console.log('Dados recebidos:', resultadoCandidato.dados);
            console.log('Tem propriedade debitos?', resultadoCandidato.dados?.debitos);
            console.log('Tem propriedade totalDevido?', resultadoCandidato.dados?.totalDevido);
            
            form_esconderLoading();
            mostrarModalPendencia(resultadoCandidato.dados);
            form_processandoMatricula = false;
            return;
        }

        // ==========================================
        // VERIFICAR INADIMPLÊNCIA DO RESPONSÁVEL
        // ==========================================
        if (dados.menorIdade === 'sim') {
            console.log('Verificando inadimplência do responsável:', dados.cpfResponsavel);
            
            const resultadoResponsavel = await verificarInadimplencia(dados.cpfResponsavel);
            
            console.log('Resultado da verificação (responsável):', resultadoResponsavel);

            if (resultadoResponsavel.inadimplente) {
                console.log('INADIMPLENTE DETECTADO (RESPONSÁVEL)!');
                console.log('Dados recebidos:', resultadoResponsavel.dados);
                
                form_esconderLoading();
                mostrarModalPendencia(resultadoResponsavel.dados);
                form_processandoMatricula = false;
                return;
            }
        }

        // ==========================================
        // REGISTRAR INSCRIÇÃO
        // ==========================================
        console.log('Nenhuma inadimplência detectada. Registrando inscrição...');
        
        const resultadoInscricao = await registrarInscricao(dados);
        form_esconderLoading();

        console.log('Resultado da inscrição:', resultadoInscricao);

        if (resultadoInscricao.sucesso) {
            console.log('MATRÍCULA REALIZADA COM SUCESSO!');
            mostrarModalSucesso(resultadoInscricao.protocolo);
            limparFormulario();
        } else {
            console.log('ERRO ao registrar inscrição');
            mostrarAlerta('Erro ao registrar inscrição. Tente novamente.', 'danger');
        }

    } catch (err) {
        form_esconderLoading();
        console.error('ERRO CRÍTICO:', err);
        mostrarAlerta('Erro ao processar inscrição. Tente novamente mais tarde.', 'danger');
    } finally {
        form_processandoMatricula = false;
        console.log('========================================');
        console.log('FIM DO PROCESSO DE MATRÍCULA');
        console.log('========================================');
    }
});

// =====================================================
//  VALIDAÇÃO DE CAMPOS DO FORMULÁRIO
// =====================================================
function validarFormulario() {
    if (!validarFormatoCPF(cpfCandidatoInput.value)) {
        mostrarAlerta('CPF do candidato inválido.', 'danger');
        cpfCandidatoInput.focus();
        return false;
    }

    if (menorIdadeSelect.value === 'sim' && !validarFormatoCPF(cpfResponsavelInput.value)) {
        mostrarAlerta('CPF do responsável inválido.', 'danger');
        cpfResponsavelInput.focus();
        return false;
    }

    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) {
        mostrarAlerta('CEP inválido.', 'danger');
        cepInput.focus();
        return false;
    }

    const tel = telefoneInput.value.replace(/\D/g, '');
    if (tel.length < 10) {
        mostrarAlerta('Telefone inválido.', 'danger');
        telefoneInput.focus();
        return false;
    }

    return true;
}

// =====================================================
//  COLETA E ESTRUTURAÇÃO DOS DADOS DO FORMULÁRIO
// =====================================================
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

// =====================================================
//  RESET DO FORMULÁRIO
// =====================================================
function limparFormulario() {
    form.reset();
    responsavelSection.style.display = 'none';
}

// =====================================================
//  INTERFACE - Funções de apoio visual
// =====================================================
function mostrarAlerta(msg, tipo) {
    alertBox.className = `alert alert-${tipo} show`;
    alertBox.textContent = msg;
    setTimeout(() => alertBox.classList.remove('show'), 5000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function form_mostrarLoading(msg = 'Processando...') {
    if (!form_processandoMatricula) return;
    loading.querySelector('p').textContent = msg;
    loading.classList.add('show');
    form.style.display = 'none';
}

function form_esconderLoading() {
    loading.classList.remove('show');
    form.style.display = 'block';
}

// =====================================================
//  MODAL DE PENDÊNCIA - VERSÃO COMPATÍVEL COM MONGODB
// =====================================================
function mostrarModalPendencia(dados) {
    console.log('========================================');
    console.log('EXIBINDO MODAL DE PENDÊNCIA');
    console.log('Dados recebidos (RAW):', JSON.stringify(dados, null, 2));
    console.log('========================================');

    const debtDetails = document.getElementById('debtDetails');
    
    if (!dados) {
        console.error('ERRO: dados é null ou undefined');
        mostrarAlerta('Erro ao exibir detalhes da pendência.', 'danger');
        return;
    }

    let html = '';
    let totalCalculado = 0;

    // Verificar se tem array de débitos
    if (dados.debitos && Array.isArray(dados.debitos) && dados.debitos.length > 0) {
        console.log(`Processando ${dados.debitos.length} débitos`);
        
        dados.debitos.forEach((d, index) => {
            console.log(`Débito ${index}:`, d);
            
            // Aceitar múltiplas variações de campo
            const descricao = d.descricao || d.description || d.tipo || d.type || 'Débito não especificado';
            const valor = parseFloat(d.valor || d.value || d.amount || d.preco || 0);
            
            console.log(`  - Descrição: ${descricao}`);
            console.log(`  - Valor: R$ ${valor.toFixed(2)}`);
            
            totalCalculado += valor;
            
            html += `<div class="debt-item">
                <span>${descricao}</span>
                <span>R$ ${valor.toFixed(2)}</span>
            </div>`;
        });

        // Aceitar múltiplas variações de campo total
        // ✅ CORRIGIDO: aceita total_devido (MongoDB) e totalDevido (JavaScript)
        const totalFinal = dados.total_devido || dados.totalDevido || dados.total || totalCalculado;
        
        console.log(`Total calculado: R$ ${totalCalculado.toFixed(2)}`);
        console.log(`Total do banco: R$ ${totalFinal}`);
        
        html += `<div class="debt-item">
            <span><strong>Total devido</strong></span>
            <span><strong>R$ ${parseFloat(totalFinal).toFixed(2)}</strong></span>
        </div>`;
    }
    // Fallback se não encontrar débitos estruturados
    else {
        console.warn('AVISO: Estrutura de débitos não encontrada');
        console.log('Propriedades disponíveis:', Object.keys(dados));
        
        html = `<div class="debt-item">
            <span>Pendência financeira detectada</span>
            <span>Consulte a secretaria</span>
        </div>
        <div class="debt-item">
            <span><strong>Status</strong></span>
            <span><strong>${dados.status || 'PENDENTE'}</strong></span>
        </div>`;
        
        // Se tiver total_devido ou totalDevido, mostrar
        const total = dados.total_devido || dados.totalDevido || dados.total;
        if (total) {
            html += `<div class="debt-item">
                <span><strong>Valor aproximado</strong></span>
                <span><strong>R$ ${parseFloat(total).toFixed(2)}</strong></span>
            </div>`;
        }
    }
    
    debtDetails.innerHTML = html;
    
    console.log('HTML final:', html);
    console.log('Exibindo modal...');
    
    pendenciaModal.classList.add('show');
    
    console.log('Modal exibido. Classes:', pendenciaModal.classList.toString());
    
    // Garantir que modal seja visível
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fecharModal() {
    console.log('Fechando modal de pendência');
    pendenciaModal.classList.remove('show');
    limparFormulario();
}

function mostrarModalSucesso(protocolo) {
    console.log('Exibindo modal de sucesso. Protocolo:', protocolo);
    document.getElementById('protocoloNumero').textContent = protocolo;
    sucessoModal.classList.add('show');
}

function fecharModalSucesso() {
    console.log('Fechando modal de sucesso');
    sucessoModal.classList.remove('show');
    limparFormulario();
}

console.log('SCRIPT DO FORMULÁRIO CARREGADO COM DEBUG ATIVADO');