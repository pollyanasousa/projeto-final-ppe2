// =====================================================
// API.JS – CAMADA DE INTEGRAÇÃO DO FRONTEND COM O BACKEND
// =====================================================

const API_URL = 'https://projeto-final-ppe2.onrender.com'; // Backend produção

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

// Funções auxiliares de formatação (CPF, CEP, telefone)
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
    const t = telefone.replace(/\D/g, '');
    if (t.length === 11) return t.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (t.length === 10) return t.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return telefone;
}
