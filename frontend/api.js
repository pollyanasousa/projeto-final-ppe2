// =====================================================
// API.JS – CAMADA DE INTEGRAÇÃO DO FRONTEND COM O BACKEND
// =====================================================
// Função: Centraliza todas as comunicações HTTP do frontend
// com o backend Node.js e APIs externas (BrasilAPI).
// -----------------------------------------------------
// Observações de implementação:
// - Mantido isolado do script principal (script.js).
// - Comentários detalhados e instrutivos.
// =====================================================

// -----------------------------------------------------
// CONFIGURAÇÃO BÁSICA
// -----------------------------------------------------
// URL base do servidor backend em produção (Render)
const API_URL = 'https://projeto-final-ppe2.onrender.com';

/* =====================================================
   CONSULTA DE CEP – BRASIL API
   -----------------------------------------------------
   Realiza consulta externa para preencher o endereço
   automaticamente a partir do CEP informado.
   ===================================================== */
async function consultarCEP(cep) {
    try {
        const cepLimpo = cep.replace(/\D/g, '');

        if (cepLimpo.length !== 8) {
            throw new Error('CEP inválido');
        }

        // Requisição direta à Brasil API
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);

        if (!response.ok) {
            throw new Error('CEP não encontrado');
        }

        const dados = await response.json();

        // Retorno padronizado para uso no frontend
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

/* =====================================================
   VERIFICAÇÃO DE INADIMPLÊNCIA – API PRÓPRIA
   -----------------------------------------------------
   Consulta o backend para saber se o CPF informado
   possui pendências financeiras no sistema.
   ===================================================== */
async function verificarInadimplencia(cpf) {
    try {
        const cpfLimpo = cpf.replace(/\D/g, '');

        const response = await fetch(`${API_URL}/api/verificar-inadimplencia?cpf=${cpfLimpo}`);

        if (!response.ok) {
            throw new Error('Erro ao consultar servidor');
        }

        return await response.json();

    } catch (error) {
        console.error('Erro ao verificar inadimplência:', error);
        return { sucesso: false, erro: error.message };
    }
}

/* =====================================================
   REGISTRO DE INSCRIÇÃO – API PRÓPRIA
   -----------------------------------------------------
   Envia os dados completos de matrícula para o backend,
   onde serão validados e salvos no banco MongoDB.
   ===================================================== */
async function registrarInscricao(dados) {
    try {
        const response = await fetch(`${API_URL}/api/inscricao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            throw new Error('Erro ao registrar inscrição');
        }

        return await response.json();

    } catch (error) {
        console.error('Erro ao registrar inscrição:', error);
        return { sucesso: false, erro: error.message };
    }
}

/* =====================================================
   FUNÇÕES AUXILIARES DE FORMATAÇÃO
   -----------------------------------------------------
   Utilizadas para padronizar máscaras e validações
   de CPF, CEP e telefone.
   ===================================================== */

// Validação básica de CPF (não verifica dígitos verificadores)
function validarFormatoCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    // Rejeita CPFs de números repetidos
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
    if (t.length === 11) {
        return t.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (t.length === 10) {
        return t.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
}
