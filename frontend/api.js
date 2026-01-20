// =====================================================
// API.JS - INTEGRAÇÃO COM BACKEND NODE.JS + MONGODB
// =====================================================

// URL base do backend
const API_URL = 'http://localhost:3000';

// ===== API DE CONSULTA DE CEP (Brasil API) =====
async function consultarCEP(cep) {
    try {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) throw new Error('CEP inválido');

        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
        if (!response.ok) throw new Error('CEP não encontrado');

        const dados = await response.json();
        return {
            sucesso: true,
            dados: {
                cep: dados.cep,
                logradouro: dados.street,
                bairro: dados.neighborhood,
                cidade: dados.city,
                uf: dados.state
            }
        };
    } catch (error) {
        return { sucesso: false, erro: error.message };
    }
}

// ===== API PRÓPRIA - VERIFICAÇÃO DE INADIMPLÊNCIA =====
async function verificarInadimplencia(cpf) {
    try {
        const cpfLimpo = cpf.replace(/\D/g, '');
        const response = await fetch(`${API_URL}/api/verificar-inadimplencia?cpf=${cpfLimpo}`);
        if (!response.ok) throw new Error('Erro ao consultar servidor');

        return await response.json();
    } catch (error) {
        console.error('Erro ao verificar inadimplência:', error);
        return { sucesso: false, erro: error.message };
    }
}

// ===== API PRÓPRIA - REGISTRO DE INSCRIÇÃO =====
async function registrarInscricao(dados) {
    try {
        const response = await fetch(`${API_URL}/api/inscricao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (!response.ok) throw new Error('Erro ao registrar inscrição');

        return await response.json();
    } catch (error) {
        console.error('Erro ao registrar inscrição:', error);
        return { sucesso: false, erro: error.message };
    }
}

// ===== FUNÇÕES AUXILIARES =====
function validarFormatoCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    return true;
}

function formatarCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarCEP(cep) {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatarTelefone(telefone) {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length === 11) return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (telefoneLimpo.length === 10) return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return telefone;
}
