// cypress/support/commands.js
// Comandos customizados para facilitar os testes

// ***********************************************
// COMANDOS PARA FORMULÁRIO DE MATRÍCULA
// ***********************************************

/**
 * Preenche dados básicos do candidato
 * @param {Object} dados - Objeto com dados do candidato
 */
Cypress.Commands.add('preencherDadosCandidato', (dados) => {
  if (dados.nome) {
    cy.get('#nomeCompleto').type(dados.nome)
  }
  
  if (dados.dataNascimento) {
    cy.get('#dataNascimento').type(dados.dataNascimento)
  }
  
  if (dados.cpf) {
    cy.get('#cpfCandidato').type(dados.cpf)
  }
  
  if (dados.menorIdade !== undefined) {
    cy.get('#menorIdade').select(dados.menorIdade ? 'sim' : 'nao')
  }
})

/**
 * Preenche dados do responsável legal
 */
Cypress.Commands.add('preencherDadosResponsavel', (dados) => {
  cy.get('#responsavelSection').should('be.visible')
  
  if (dados.nome) {
    cy.get('#nomeResponsavel').type(dados.nome)
  }
  
  if (dados.cpf) {
    cy.get('#cpfResponsavel').type(dados.cpf)
  }
})

/**
 * Preenche dados de contato
 */
Cypress.Commands.add('preencherDadosContato', (dados) => {
  if (dados.email) {
    cy.get('#email').type(dados.email)
  }
  
  if (dados.telefone) {
    cy.get('#telefone').type(dados.telefone)
  }
})

/**
 * Preenche endereço completo
 */
Cypress.Commands.add('preencherEndereco', (dados) => {
  if (dados.cep) {
    cy.get('#cep').type(dados.cep)
    
    // Se aguardarAPI = true, espera consulta CEP
    if (dados.aguardarAPI) {
      cy.get('#cep').blur()
      cy.wait(2000)
    }
  }
  
  if (dados.numero) {
    cy.get('#numero').type(dados.numero)
  }
  
  if (dados.complemento) {
    cy.get('#complemento').type(dados.complemento)
  }
})

/**
 * Preenche dados do curso
 */
Cypress.Commands.add('preencherDadosCurso', (dados) => {
  if (dados.instrumento) {
    cy.get('#instrumento').select(dados.instrumento)
  }
  
  if (dados.nivelExperiencia) {
    cy.get('#nivelExperiencia').select(dados.nivelExperiencia)
  }
  
  if (dados.solicitaIsencao) {
    cy.get('#solicitaIsencao').check()
  }
})

/**
 * Preenche formulário completo de matrícula
 */
Cypress.Commands.add('preencherFormularioCompleto', (dados) => {
  cy.preencherDadosCandidato({
    nome: dados.nome || 'Teste Completo',
    dataNascimento: dados.dataNascimento || '2000-01-01',
    cpf: dados.cpf || '11111111111',
    menorIdade: dados.menorIdade || false
  })
  
  if (dados.menorIdade && dados.responsavel) {
    cy.preencherDadosResponsavel(dados.responsavel)
  }
  
  cy.preencherDadosContato({
    email: dados.email || 'teste@email.com',
    telefone: dados.telefone || '81999999999'
  })
  
  cy.preencherEndereco({
    cep: dados.cep || '50030230',
    numero: dados.numero || '100',
    complemento: dados.complemento,
    aguardarAPI: dados.aguardarAPI !== false
  })
  
  cy.preencherDadosCurso({
    instrumento: dados.instrumento || 'piano',
    nivelExperiencia: dados.nivelExperiencia || 'iniciante',
    solicitaIsencao: dados.solicitaIsencao || false
  })
})

// ***********************************************
// COMANDOS PARA MODAIS
// ***********************************************

/**
 * Aguarda modal de sucesso aparecer
 */
Cypress.Commands.add('aguardarModalSucesso', () => {
  cy.get('#loading', { timeout: 1000 }).should('be.visible')
  cy.get('#sucessoModal', { timeout: 10000 })
    .should('be.visible')
    .and('have.class', 'show')
})

/**
 * Aguarda modal de pendência aparecer
 */
Cypress.Commands.add('aguardarModalPendencia', () => {
  cy.get('#loading', { timeout: 1000 }).should('be.visible')
  cy.get('#pendenciaModal', { timeout: 10000 })
    .should('be.visible')
    .and('have.class', 'show')
})

/**
 * Fecha modal e limpa formulário
 */
Cypress.Commands.add('fecharModal', (tipo = 'sucesso') => {
  const seletor = tipo === 'sucesso' ? '#sucessoModal' : '#pendenciaModal'
  cy.get(`${seletor} button`).click()
  cy.get(seletor).should('not.have.class', 'show')
})

// ***********************************************
// COMANDOS PARA AGENTE IA
// ***********************************************

/**
 * Abre o chat do assistente
 */
Cypress.Commands.add('abrirAgente', () => {
  cy.get('#agente-btn').click()
  cy.get('#agente-chat').should('not.have.class', 'hidden')
})

/**
 * Fecha o chat do assistente
 */
Cypress.Commands.add('fecharAgente', () => {
  cy.get('#agente-fechar').click()
  cy.get('#agente-chat').should('have.class', 'hidden')
})

/**
 * Envia mensagem no chat do assistente
 */
Cypress.Commands.add('enviarMensagemAgente', (mensagem) => {
  cy.get('#agente-input')
    .type(mensagem)
    .type('{enter}')
  
  // Aguardar mensagem aparecer
  cy.wait(500)
  cy.get('#agente-messages .agente-message')
    .last()
    .should('contain', mensagem)
})

// ***********************************************
// COMANDOS PARA VALIDAÇÕES
// ***********************************************

/**
 * Verifica formatação de CPF
 */
Cypress.Commands.add('verificarFormatoCPF', (seletor, cpf) => {
  cy.get(seletor)
    .invoke('val')
    .should('match', /^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
})

/**
 * Verifica formatação de telefone
 */
Cypress.Commands.add('verificarFormatoTelefone', (seletor) => {
  cy.get(seletor)
    .invoke('val')
    .should('match', /^\(\d{2}\) \d{4,5}-\d{4}$/)
})

/**
 * Verifica formatação de CEP
 */
Cypress.Commands.add('verificarFormatoCEP', (seletor) => {
  cy.get(seletor)
    .invoke('val')
    .should('match', /^\d{5}-\d{3}$/)
})

/**
 * Verifica protocolo gerado
 */
Cypress.Commands.add('verificarProtocolo', () => {
  cy.get('#protocoloNumero')
    .should('not.be.empty')
    .invoke('text')
    .should('match', /PROT-\d{8}/)
})

// ***********************************************
// COMANDOS UTILITÁRIOS
// ***********************************************

/**
 * Aguarda tempo específico com mensagem
 */
Cypress.Commands.add('aguardar', (ms, mensagem = '') => {
  if (mensagem) {
    cy.log(`⏳ Aguardando ${ms}ms - ${mensagem}`)
  }
  cy.wait(ms)
})

/**
 * Limpa formulário completamente
 */
Cypress.Commands.add('limparFormulario', () => {
  cy.get('#inscricaoForm').then($form => {
    $form[0].reset()
  })
})

/**
 * Screenshot com nome customizado
 */
Cypress.Commands.add('capturarTela', (nome) => {
  cy.screenshot(nome, { capture: 'fullPage' })
})

// ***********************************************
// SOBRESCREVER COMANDOS EXISTENTES (se necessário)
// ***********************************************

// Adicionar timeout maior para cy.visit
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  return originalFn(url, { 
    ...options, 
    timeout: 30000,
    onBeforeLoad(win) {
      // Pode adicionar mocks ou stubs aqui
    }
  })
})